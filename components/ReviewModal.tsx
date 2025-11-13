import React, { useState, useEffect, useMemo } from 'react';
import type { Order, OrderItem, Client } from '../types';

interface ReviewModalProps {
  order: Order;
  clients: Client[];
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ order, clients, onClose, onSave }) => {
  const [editedOrder, setEditedOrder] = useState<Order>(() => JSON.parse(JSON.stringify(order)));

  useEffect(() => {
    setEditedOrder(JSON.parse(JSON.stringify(order)));
  }, [order]);
  
  const handleItemChange = (itemId: number, field: keyof OrderItem, value: string | number) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: typeof value === 'string' ? value : (isNaN(value) ? 0 : value) } : item
      ),
    }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedOrder(prev => ({ ...prev, clientId: parseInt(e.target.value) }));
  };

  const addItemRow = () => {
    const newItem: OrderItem = {
      id: Date.now(), // Temporary unique ID for React key
      code: '',
      concept: '',
      quantity: 1,
      price: 0,
      discount: 0
    };
    setEditedOrder(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItemRow = (itemId: number) => {
    if (editedOrder.items.length <= 1) {
      alert("Un pedido debe tener al menos una línea.");
      return;
    }
    setEditedOrder(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
  };

  const { baseTotal, ivaTotal, totalFinal } = useMemo(() => {
    const base = editedOrder.items.reduce((acc, item) => {
      const itemTotal = item.quantity * item.price * (1 - item.discount / 100);
      return acc + itemTotal;
    }, 0);
    const iva = base * 0.21;
    const final = base + iva;
    return { baseTotal: base, ivaTotal: iva, totalFinal: final };
  }, [editedOrder.items]);

  const handleSaveClick = () => {
    onSave({...editedOrder, total: totalFinal});
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-gray-800 w-full max-w-4xl p-6 rounded-lg shadow-xl relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-3xl font-bold">&times;</button>
          
          <h3 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Revisión de Pedido: <span>{order.id}</span></h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400">Cliente</label>
              <select 
                value={editedOrder.clientId} 
                onChange={handleClientChange} 
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-gray-100 p-2 border rounded-md"
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400">Vendedor</label>
              <input type="text" value="Vendedor Único" className="mt-1 block w-full bg-gray-900 border-gray-700 text-gray-400 p-2 border rounded-md" disabled />
            </div>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Código</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Concepto</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cant.</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">P. Unit. (€)</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Desc. (%)</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Subtotal (€)</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {editedOrder.items.map(item => {
                  const subtotal = item.quantity * item.price * (1 - item.discount / 100);
                  return (
                    <tr key={item.id}>
                      <td className="p-1"><input type="text" value={item.code} onChange={e => handleItemChange(item.id, 'code', e.target.value)} className="w-full bg-gray-700 p-1 rounded" /></td>
                      <td className="p-1"><input type="text" value={item.concept} onChange={e => handleItemChange(item.id, 'concept', e.target.value)} className="w-full bg-gray-700 p-1 rounded" /></td>
                      <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} min="1" className="w-16 bg-gray-700 p-1 rounded text-center" /></td>
                      <td className="p-1"><input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))} min="0" step="0.01" className="w-24 bg-gray-700 p-1 rounded text-right" /></td>
                      <td className="p-1"><input type="number" value={item.discount} onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value))} min="0" max="100" className="w-16 bg-gray-700 p-1 rounded text-center" /></td>
                      <td className="p-1 whitespace-nowrap text-sm font-medium text-gray-200 text-right">{subtotal.toFixed(2)} €</td>
                      <td className="p-1 text-center">
                        <button 
                            onClick={() => removeItemRow(item.id)} 
                            className="text-red-500 hover:text-red-400 disabled:opacity-50"
                            disabled={editedOrder.items.length <= 1}
                            title="Eliminar línea"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={addItemRow} className="text-sm text-gray-300 hover:text-white">+ Añadir línea</button>

          <div className="flex justify-end mt-4">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-gray-400"><span>Base Imponible:</span><span>{baseTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between text-sm text-gray-400"><span>IVA (21%):</span><span>{ivaTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between text-xl font-bold text-gray-100 border-t border-gray-600 pt-2"><span>TOTAL ALBARÁN:</span><span>{totalFinal.toFixed(2)} €</span></div>
            </div>
          </div>

          <div className="flex justify-end pt-6 space-x-3">
            <button onClick={handleSaveClick} className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold py-2 px-4 rounded-md transition-colors">Guardar Revisión y Marcar como Listo</button>
          </div>
        </div>
      </div>
    </div>
  );
};