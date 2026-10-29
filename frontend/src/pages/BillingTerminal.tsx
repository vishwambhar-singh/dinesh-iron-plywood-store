import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Button, Input, Badge } from '@chakra-ui/react';
import api from '../utils/api';
import SearchableSelect from '../components/SearchableSelect';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import SaleDetailModal from '../components/SaleDetailModal';
import PurchaseDetailModal from '../components/PurchaseDetailModal';
import { getLocalDateString } from '../utils/date';

const BillingTerminal = ({ panelMode = 'PAKKA' }: { panelMode?: 'PAKKA' | 'ACTUAL' }) => {
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Terminal Mode Toggle
  const [mode, setMode] = useState<'SALE' | 'PURCHASE'>('SALE');
  
  // Entity Selection (Customer ID or Supplier ID)
  const [entityId, setEntityId] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<{shade_id: string, item_id: string, qty: number, pakka_price: number, shade_label: string, item_name: string}[]>([]);
  
  // Temporary selections
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedShade, setSelectedShade] = useState('');
  const [qty, setQty] = useState(1);
  const [customRate, setCustomRate] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(getLocalDateString());

  // New Billing Fields
  const [billingAddress, setBillingAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [dispatchThrough, setDispatchThrough] = useState('');
  const [destination, setDestination] = useState('');
  const [gstType, setGstType] = useState<'LOCAL' | 'INTERSTATE'>('LOCAL');
  const [setDefaultAddress, setSetDefaultAddress] = useState(false);
  
  const [insuranceAmount, setInsuranceAmount] = useState<number | ''>('');
  const [insuranceName, setInsuranceName] = useState('');

  const [receipt, setReceipt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shadeSearchQuery, setShadeSearchQuery] = useState('');
  const [manualInvoiceNo, setManualInvoiceNo] = useState('');

  useKeyboardShortcuts({
    'Alt+s': () => setMode('SALE'),
    'Alt+p': () => setMode('PURCHASE'),
    'Escape': () => {
        if (receipt) setReceipt(null);
        else {
            setSelectedItem('');
            setSelectedShade('');
            setShadeSearchQuery('');
        }
    },
    'Alt+Enter': () => {
        if (cart.length > 0 && entityId) handleCheckout();
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, cusRes, supRes] = await Promise.all([
            api.get('/items'), 
            api.get('/customers'),
            api.get('/suppliers')
        ]);
        setItems(itemsRes.data);
        setCustomers(cusRes.data);
        setSuppliers(supRes.data);
      } catch (err) {}
    };
    fetchData();
  }, []);

  // Sync address and GST when customer/supplier changes
  useEffect(() => {
      if (mode === 'SALE' && entityId) {
          const cust = customers.find(c => c.id === entityId);
          if (cust) {
              setBillingAddress(cust.address || '');
              setCustomerGst(cust.gstNumber || '');
          }
      } else if (mode === 'PURCHASE' && entityId) {
          const sup = suppliers.find(s => s.id === entityId);
          if (sup) {
              setBillingAddress(sup.address || '');
              setCustomerGst(sup.gstNumber || sup.gst_number || '');
          }
      }
  }, [entityId, customers, suppliers, mode]);

  const activeItemData = items.find(i => i.id === selectedItem);

  useEffect(() => {
     if (activeItemData) {
        const rate = mode === 'PURCHASE' ? activeItemData.base_pakka_purchase_rate : activeItemData.base_pakka_selling_rate;
        setCustomRate(rate);
     } else {
        setCustomRate('');
     }
  }, [activeItemData, mode]);

  const handleAdd = () => {
    if (!selectedItem || !selectedShade || qty <= 0 || customRate === '') return;
    const targetShade = activeItemData.shades.find((s:any) => s.id === selectedShade);
    setCart([...cart, { 
      shade_id: selectedShade, 
      item_id: selectedItem, 
      qty,
      pakka_price: Number(customRate),
      shade_label: targetShade.shade_id_label,
      item_name: activeItemData.name
    }]);
    setSelectedItem('');
    setSelectedShade('');
    setShadeSearchQuery('');
    setQty(1);
    setCustomRate('');
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      let payload;
      let endpoint = mode === 'SALE' ? '/billing/sale' : '/billing/purchase';

      if (mode === 'SALE') {
        payload = { 
            customer_id: entityId, 
            items: cart, 
            sale_date: transactionDate,
            billing_address: billingAddress,
            customer_gst: customerGst,
            dispatch_through: dispatchThrough,
            destination: destination,
            gst_type: gstType,
            insurance_amount: insuranceAmount,
            insurance_name: insuranceName,
            set_default_address: setDefaultAddress
        };
      } else {
        payload = { 
            supplier_id: entityId, 
            items: cart, 
            bill_date: transactionDate,
            billing_address: billingAddress,
            supplier_gst: customerGst,
            dispatch_through: dispatchThrough,
            destination: destination,
            insurance_amount: insuranceAmount,
            insurance_name: insuranceName,
            gst_type: gstType
        };
      }
      
      const response = await api.post(endpoint, payload);
      
      let fullDetails = null;
      if (mode === 'SALE') {
          const detailRes = await api.get(`/billing/sale/${response.data.sale_id}/items`);
          fullDetails = detailRes.data;
      } else {
          const detailRes = await api.get(`/billing/purchase/${response.data.bill_id}/items`);
          fullDetails = detailRes.data;
      }
      
      const exactTotal = cart.reduce((sum, item) => sum + (item.pakka_price * item.qty), 0);
      const exactGstTotal = cart.reduce((sum, item) => sum + ((item.pakka_price * item.qty) * 0.18), 0); // Assuming 18% overall or based on cart
      
      setReceipt({ 
          ...response.data, 
          fullDetails,
          billing_address: billingAddress,
          customer_gst: customerGst,
          dispatch_through: dispatchThrough,
          destination: destination,
          gst_type: gstType
      });
      setShowModal(true);
      
      window.alert('Transaction Committed successfully!');
    } catch (err: any) {
      window.alert((panelMode === 'PAKKA' ? 'Transaction Failed: ' : 'Godown Rejection: ') + (err.response?.data?.error || 'Validation Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecord = () => {
      setReceipt(null);
      setShowModal(false);
      setCart([]);
      setEntityId('');
      setTransactionDate(getLocalDateString());
      setBillingAddress('');
      setCustomerGst('');
      setDispatchThrough('');
      setDestination('');
      setInsuranceAmount('');
      setInsuranceName('');
      setGstType('LOCAL');
      setSetDefaultAddress(false);
  };

  return (
    <Box p={6} color="var(--text-primary)">
      <Flex align="center" gap={4} mb={6}>
        <Heading size="lg" color={panelMode === 'PAKKA' ? "var(--brand-maroon)" : "#d97706"}>
            {panelMode === 'PAKKA' ? 'Billing Terminal' : 'Internal Terminal'}
        </Heading>
        <Badge colorScheme={mode === 'SALE' ? 'green' : 'purple'} px={3} py={1} borderRadius="md" fontSize="sm">
            {mode} TERMINAL
        </Badge>
      </Flex>

      <Flex gap={4} mb={8}>
        <Button 
          colorScheme={mode === 'SALE' ? 'blue' : 'gray'} 
          variant={mode === 'SALE' ? 'solid' : 'outline'}
          onClick={() => { setMode('SALE'); handleNewRecord(); }}
        >
          Customer Checkout
        </Button>
        <Button 
          colorScheme={mode === 'PURCHASE' ? 'orange' : 'gray'} 
          variant={mode === 'PURCHASE' ? 'solid' : 'outline'}
          onClick={() => { setMode('PURCHASE'); handleNewRecord(); }}
        >
          Supplier Inbound
        </Button>
      </Flex>

      {receipt ? (
        <Box bg="white" shadow="md" borderRadius="xl" p={8} textAlign="center" border="1px solid" borderColor="var(--border-color)" maxW="3xl" mx="auto">
            <Heading color="green.600" mb={4}>
              {panelMode === 'PAKKA' ? 'Bill Generated Successfully!' : 'Godown Entry Executed!'}
            </Heading>
            <Text color="var(--text-secondary)" mb={8}>
              {panelMode === 'PAKKA' ? 'Your invoice has been generated and recorded.' : 'Internal entry has been saved.'}
            </Text>
            
            <Flex gap={6} mb={8}>
                {panelMode === 'PAKKA' && (
                    <Box flex={1} bg="var(--bg-secondary)" p={6} borderRadius="lg" border="1px solid" borderColor="var(--border-color)">
                        <Text fontSize="sm" fontWeight="bold" color="var(--text-muted)" textTransform="uppercase">Total Amount</Text>
                        <Heading size="xl" color="var(--brand-maroon)" mt={2}>
                            ₹{cart.reduce((sum, item) => sum + (item.pakka_price * item.qty), 0).toFixed(2)}
                        </Heading>
                        <Text fontSize="xs" color="var(--text-muted)" mt={2}>Invoice Ref: {receipt.invoice_number || receipt.bill_number || receipt.voucher_no}</Text>
                    </Box>
                )}
                {panelMode === 'ACTUAL' && (
                    <Box flex={1} bg="orange.50" p={6} borderRadius="lg" border="1px solid" borderColor="orange.200">
                        <Text fontSize="sm" fontWeight="bold" color="orange.700" textTransform="uppercase">Godown Total</Text>
                        <Heading size="xl" color="orange.600" mt={2}>
                            ₹{cart.reduce((sum, item) => sum + (item.pakka_price * item.qty), 0).toFixed(2)}
                        </Heading>
                        <Text fontSize="xs" color="orange.400" mt={2}>Godown Root: {receipt.voucher_no}</Text>
                    </Box>
                )}
            </Flex>

            <Flex gap={4} justify="center">
                <Button colorScheme="green" size="lg" onClick={() => setShowModal(true)}>View & Print Bill</Button>
                <Button variant="outline" colorScheme="gray" size="lg" onClick={handleNewRecord}>Start New Session</Button>
            </Flex>
        </Box>
      ) : (
        <Flex gap={8} align="flex-start">
            <Box flex={2} bg="white" p={6} shadow="sm" borderRadius="xl" border="1px solid" borderColor="var(--border-color)">
                <Heading size="md" mb={6} color="var(--text-primary)">Billing Desk</Heading>
                
                <Flex gap={6} mb={6} direction={{ base: 'column', md: 'row' }}>
                    <Box flex={2}>
                        <Text fontWeight="bold" mb={2} fontSize="sm" color="var(--text-secondary)">{mode === 'SALE' ? 'Select Customer' : 'Select Supplier'}</Text>
                        <SearchableSelect
                            options={mode === 'SALE' 
                                ? customers.map(c => ({ id: c.id, label: c.name, sublabel: panelMode === 'PAKKA' ? `GST: ${c.gstNumber || 'N/A'}` : '' }))
                                : suppliers.map(s => ({ id: s.id, label: s.name, sublabel: panelMode === 'PAKKA' ? `GST: ${s.gstNumber || 'N/A'}` : '' }))
                            }
                            value={entityId}
                            onChange={setEntityId}
                            placeholder="-- Choose Name --"
                        />
                    </Box>
                    <Box flex={1}>
                        <Text fontWeight="bold" mb={2} fontSize="sm" color="var(--text-secondary)">Invoice Number</Text>
                        <Input 
                            value="Auto-generated"
                            disabled
                            className="form-input" 
                            style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                        />
                    </Box>
                    <Box flex={1}>
                        <Text fontWeight="bold" mb={2} fontSize="sm" color="var(--text-secondary)">Date</Text>
                        <Input 
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            className="form-input" 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'white' }}
                        />
                    </Box>
                </Flex>

                {panelMode === 'PAKKA' && (
                    <Box bg={mode === 'SALE' ? "blue.50" : "orange.50"} p={4} borderRadius="lg" mb={6} border="1px solid" borderColor={mode === 'SALE' ? "blue.100" : "orange.100"}>
                        <Heading size="sm" mb={4} color={mode === 'SALE' ? "blue.700" : "orange.700"}>Billing & Dispatch Details</Heading>
                        <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
                            <Box flex={2}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>{mode === 'SALE' ? 'Billing Address' : 'Dispatched From Address'}</Text>
                                <Input bg="white" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Enter Address..." />
                            </Box>
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>{mode === 'SALE' ? 'Customer GST' : 'Supplier GST'}</Text>
                                <Input bg="white" value={customerGst} onChange={e => setCustomerGst(e.target.value)} placeholder="GST Number" />
                            </Box>
                        </Flex>
                        <Flex gap={4} align="center">
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>Dispatch Through</Text>
                                <Input bg="white" value={dispatchThrough} onChange={e => setDispatchThrough(e.target.value)} placeholder="e.g. Navkar Transport, Vehicle No..." />
                            </Box>
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>Destination (Optional)</Text>
                                <Input bg="white" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Mumbai" />
                            </Box>
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>GST Type</Text>
                                <SearchableSelect 
                                    placeholder="Select Type"
                                    options={[{id: 'LOCAL', label: 'Local (CGST+SGST)'}, {id: 'INTERSTATE', label: 'Interstate (IGST)'}, {id: 'NONE', label: 'None / Cash'}]}
                                    value={gstType}
                                    onChange={(v) => setGstType(v as any)}
                                />
                            </Box>
                            <Box flex={1} pt={6}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <input type="checkbox" checked={setDefaultAddress} onChange={e => setSetDefaultAddress(e.target.checked)} />
                                    Save as Default Address
                                </label>
                            </Box>
                        </Flex>
                        
                        <Flex gap={4} align="center" mt={4}>
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>Insurance Amount</Text>
                                <Input type="number" bg="white" value={insuranceAmount} onChange={e => setInsuranceAmount(parseFloat(e.target.value) || '')} placeholder="Amount" />
                            </Box>
                            <Box flex={1}>
                                <Text fontWeight="bold" mb={1} fontSize="xs" color={mode === 'SALE' ? "blue.600" : "orange.600"}>Insurance Name (Opt)</Text>
                                <Input bg="white" value={insuranceName} onChange={e => setInsuranceName(e.target.value)} placeholder="Name" />
                            </Box>
                        </Flex>
                    </Box>
                )}

                <Box bg="gray.50" p={6} borderRadius="lg" border="1px solid" borderColor="var(--border-color)">
                    <Flex gap={4} mb={4}>
                        <Box flex={2}>
                            <Text fontSize="sm" fontWeight="bold" mb={2} color="var(--text-secondary)">Select Product</Text>
                            <SearchableSelect
                                options={items.map(i => ({ id: i.id, label: i.name, sublabel: `HSN: ${i.hsn_code || ''}` }))}
                                value={selectedItem}
                                onChange={(val) => { setSelectedItem(val); setSelectedShade(''); }}
                                placeholder="Select Product"
                            />
                        </Box>
                        <Box flex={1}>
                            <Text fontSize="sm" fontWeight="bold" mb={2} color="var(--text-secondary)">Select Shade/Size</Text>
                            <Input 
                                list="shades-datalist"
                                placeholder="Type to search shade..." 
                                value={shadeSearchQuery}
                                onChange={e => {
                                    const val = e.target.value;
                                    setShadeSearchQuery(val);
                                    // Try to exact match the label
                                    const found = activeItemData?.shades?.find((s:any) => s.shade_id_label === val);
                                    if (found) setSelectedShade(found.id);
                                    else setSelectedShade('');
                                }}
                                disabled={!activeItemData}
                                bg="white"
                                borderColor="var(--border-color)"
                            />
                            <datalist id="shades-datalist">
                                {activeItemData?.shades?.map((s:any) => (
                                    <option key={s.id} value={s.shade_id_label}>{s.shade_id_label} (Stock: {Math.floor(s.available_qty)})</option>
                                ))}
                            </datalist>
                        </Box>
                    </Flex>

                    <Flex gap={4} align="flex-end">
                        <Box flex={1}>
                            <Text fontSize="sm" fontWeight="bold" mb={2} color="var(--text-secondary)">Rate (₹)</Text>
                            <Input type="number" step="0.01" value={customRate} onChange={e => setCustomRate(Number(e.target.value))} bg="white" borderColor="var(--border-color)" color="var(--text-primary)" />
                        </Box>
                        <Box width="100px">
                            <Text fontSize="sm" fontWeight="bold" mb={2} color="var(--text-secondary)">Quantity</Text>
                            <Input 
                                type="number" 
                                min={1} 
                                value={qty} 
                                onChange={e => setQty(Number(e.target.value))} 
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                bg="white" 
                                borderColor="var(--border-color)" 
                                color="var(--text-primary)" 
                            />
                        </Box>
                        <Button colorScheme="blue" onClick={handleAdd} disabled={!selectedItem || !selectedShade || customRate === ''}>
                            Add To Cart
                        </Button>
                    </Flex>
                </Box>
            </Box>

            <Box flex={1} bg="white" p={6} shadow="sm" borderRadius="xl" border="1px solid" borderColor="var(--border-color)" minH="400px" display="flex" flexDirection="column">
                <Heading size="md" mb={4} color="var(--text-primary)">Cart Items</Heading>
                <Box borderBottom="1px solid" borderColor="var(--border-color)" mb={4} />

                <Box flex={1} overflowY="auto">
                    {cart.length === 0 ? <Text color="var(--text-muted)" fontSize="sm" textAlign="center" mt={10}>Cart is empty.</Text> : null}
                    {cart.map((c, i) => (
                        <Box key={i} p={3} bg="var(--bg-secondary)" mb={3} borderRadius="md" border="1px solid" borderColor="var(--border-color)">
                            <Flex justify="space-between" align="center" mb={2}>
                                <Text fontWeight="bold" fontSize="sm" color="var(--text-primary)">{c.item_name} - <Text as="span" color="blue.600">{c.shade_label}</Text></Text>
                                <Button size="xs" colorScheme="red" variant="ghost" onClick={() => setCart(cart.filter((_, idx) => idx !== i))}>Remove</Button>
                            </Flex>
                            <Flex gap={2} align="center">
                                <Text fontSize="xs" color="var(--text-secondary)">Qty:</Text>
                                <Input size="sm" type="number" w="80px" value={c.qty} min={1} onChange={(e) => {
                                    const newCart = [...cart];
                                    newCart[i].qty = Number(e.target.value);
                                    setCart(newCart);
                                }} bg="white" borderColor="var(--border-color)" />
                                <Text fontSize="xs" color="var(--text-secondary)">Rate (₹):</Text>
                                <Input size="sm" type="number" w="100px" value={c.pakka_price} onChange={(e) => {
                                    const newCart = [...cart];
                                    newCart[i].pakka_price = Number(e.target.value);
                                    setCart(newCart);
                                }} bg="white" borderColor="var(--border-color)" />
                            </Flex>
                        </Box>
                    ))}
                </Box>

                {(() => {
                    const exactTotal = cart.reduce((sum, item) => sum + (item.pakka_price * item.qty), 0);
                    const roundedTotal = Math.round(exactTotal);
                    const roundOffDiff = roundedTotal - exactTotal;
                    
                    if (cart.length > 0 && Math.abs(roundOffDiff) > 0) {
                        return (
                            <Box bg="orange.50" p={3} borderRadius="md" border="1px solid" borderColor="orange.200" mt={4}>
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="sm" color="orange.700" fontWeight="bold">Rounding Off Applied</Text>
                                    <Text fontSize="sm" color="orange.800" fontWeight="bold">
                                        {roundOffDiff > 0 ? '+' : ''}{roundOffDiff.toFixed(2)} ₹
                                    </Text>
                                </Flex>
                                <Text fontSize="xs" color="orange.600">Final Total will be <b>₹{roundedTotal}</b> (Exact was ₹{exactTotal.toFixed(2)})</Text>
                            </Box>
                        );
                    }
                    return null;
                })()}

                <Button 
                    colorScheme={cart.length > 0 && entityId ? (panelMode === 'PAKKA' ? "blue" : "orange") : "gray"} 
                    w="100%" mt={4} size="lg" 
                    disabled={cart.length === 0 || !entityId}
                    loading={loading}
                    onClick={handleCheckout}
                >
                    Complete Checkout
                </Button>
            </Box>
        </Flex>
      )}

      {showModal && mode === 'SALE' && receipt?.fullDetails?.sale && (
        <SaleDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          sale={{...receipt.fullDetails.sale, items: receipt.fullDetails.items}}
          customerName={customers.find(c => c.id === entityId)?.name || ''}
          isActual={panelMode === 'ACTUAL'}
          onRefresh={async () => {
             try {
                const detailRes = await api.get(`/billing/sale/${receipt.sale_id}/items`);
                setReceipt({...receipt, fullDetails: detailRes.data});
             } catch(e) {}
          }}
        />
      )}
      {showModal && mode === 'PURCHASE' && receipt?.fullDetails?.bill && (
        <PurchaseDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          purchase={{...receipt.fullDetails.bill, items: receipt.fullDetails.items}}
          supplierName={suppliers.find(s => s.id === entityId)?.name || ''}
          isActual={panelMode === 'ACTUAL'}
          onRefresh={async () => {
             try {
                const detailRes = await api.get(`/billing/purchase/${receipt.bill_id}/items`);
                setReceipt({...receipt, fullDetails: detailRes.data});
             } catch(e) {}
          }}
        />
      )}
    </Box>
  );
};

export default BillingTerminal;
