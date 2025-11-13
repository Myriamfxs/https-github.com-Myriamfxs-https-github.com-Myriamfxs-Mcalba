import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Order, Client, OrderItem } from '../types';
import { OrderStatus } from '../types';
import { INITIAL_ORDERS } from '../constants';
import { ReviewModal } from './ReviewModal';
import { StatusBadge } from './StatusBadge';
import { NewOrderModal } from './NewOrderModal';
import { GoogleGenAI, Type } from "@google/genai";

const VoiceOrderModal: React.FC<{
  clients: Client[];
  onClose: () => void;
  onSave: (newOrder: Omit<Order, 'id' | 'total' | 'date'>) => void;
}> = ({ clients, onClose, onSave }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'reviewing' | 'error'>('idle');
  const [error, setError] = useState('');
  const [parsedOrder, setParsedOrder] = useState<Omit<Order, 'id' | 'total' | 'date'> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setStatus('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                
                const clientListForPrompt = clients.map(c => `- ${c.name} (ID: ${c.id})`).join('\n');
                
                const prompt = `
                    Eres un asistente de pedidos para una empresa de cuchillería profesional.
                    Transcribe el siguiente audio y extrae los detalles del pedido en formato JSON.
                    El usuario mencionará el nombre del cliente, la cantidad de productos, y el nombre o código del producto.
                    Si mencionan un descuento, aplícalo. Si no, pon 0.
                    El nombre del cliente debe coincidir con uno de la siguiente lista. Devuelve su ID.
                    Si el cliente no se encuentra o no se menciona, usa el ID 0.
                    Si no se menciona un código o precio, déjalos como string vacío o 0 respectivamente.

                    Lista de Clientes:
                    ${clientListForPrompt}
                `;

                const audioPart = { inlineData: { mimeType: 'audio/webm', data: base64Audio } };
                const textPart = { text: prompt };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [textPart, audioPart] },
                    config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                        clientId: { type: Type.NUMBER, description: "ID del cliente. Usa 0 si no se encuentra." },
                        items: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                code: { type: Type.STRING },
                                concept: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                price: { type: Type.NUMBER },
                                discount: { type: Type.NUMBER },
                            },
                             required: ['concept', 'quantity']
                            },
                        },
                        },
                        required: ['items']
                    },
                    },
                });

                const result = JSON.parse(response.text);
                if (result.clientId === 0 || !clients.some(c => c.id === result.clientId)) {
                    alert("No se pudo identificar al cliente del audio. Por favor, selecciónelo manualmente.");
                }

                setParsedOrder({
                    clientId: result.clientId > 0 ? result.clientId : clients[0]?.id,
                    status: OrderStatus.PENDING_FACTUSOL,
                    items: result.items.map((item: Omit<OrderItem, 'id'>, index: number) => ({...item, id: index + 1}))
                });
                setStatus('reviewing');
            };

        } catch (err) {
            console.error(err);
            setError('Error procesando el pedido con la IA. Por favor, inténtelo de nuevo.');
            setStatus('error');
        }
      };

      mediaRecorderRef.current.start();
      setStatus('recording');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError('No se pudo acceder al micrófono. Por favor, compruebe los permisos.');
      setStatus('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Stop microphone track
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSaveClick = () => {
    if (parsedOrder) {
      onSave(parsedOrder);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'recording':
        return (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Grabando...</h3>
            <p className="text-gray-400 mb-6">Hable con claridad para registrar el pedido. Diga el nombre del cliente, los productos, las cantidades y cualquier descuento.</p>
            <button onClick={handleStopRecording} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full flex items-center mx-auto">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              Detener Grabación
            </button>
          </div>
        );
      case 'processing':
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-100 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-200">Procesando audio con IA...</h3>
            </div>
        );
      case 'reviewing':
        if (!parsedOrder) return null;
        return (
            <div>
                 <h3 className="text-2xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Revisar Pedido por Voz</h3>
                 { /* A simplified version of the review modal form */ }
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400">Cliente</label>
                    <select
                        value={parsedOrder.clientId}
                        onChange={e => setParsedOrder(p => p ? {...p, clientId: parseInt(e.target.value)} : null)}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 text-gray-100 p-2 border rounded-md"
                    >
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                        <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Concepto</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cant.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {parsedOrder.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-1"><input type="text" value={item.concept} onChange={e => {
                                const newItems = [...parsedOrder.items];
                                newItems[index].concept = e.target.value;
                                setParsedOrder(p => p ? {...p, items: newItems} : null)
                            }} className="w-full bg-gray-700 p-1 rounded" /></td>
                            <td className="p-1"><input type="number" value={item.quantity} onChange={e => {
                                const newItems = [...parsedOrder.items];
                                newItems[index].quantity = parseInt(e.target.value);
                                setParsedOrder(p => p ? {...p, items: newItems} : null)
                            }} className="w-20 bg-gray-700 p-1 rounded text-center" /></td>
                        </tr>
                        ))}
                    </tbody>
                 </table>
                 <div className="flex justify-end pt-6 space-x-3">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-gray-200 font-semibold py-2 px-4 rounded-md">Cancelar</button>
                    <button onClick={handleSaveClick} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-md">Guardar Pedido</button>
                 </div>
            </div>
        )
      case 'error':
         return (
             <div className="text-center">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Error</h3>
                <p className="text-gray-300 mb-6">{error}</p>
                <button onClick={() => setStatus('idle')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Intentar de Nuevo</button>
             </div>
         );
      case 'idle':
      default:
        return (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Crear Pedido por Voz</h3>
            <p className="text-gray-400 mb-6">Pulse el botón para empezar a grabar su pedido.</p>
            <button onClick={handleStartRecording} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-full flex items-center mx-auto">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              Grabar Pedido
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-gray-800 w-full max-w-lg p-6 rounded-lg shadow-xl relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-3xl font-bold">&times;</button>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  clients: Client[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ clients }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isVoiceOrderModalOpen, setIsVoiceOrderModalOpen] = useState(false);

  const handleOpenReviewModal = (orderId: string) => {
    const orderToReview = orders.find(o => o.id === orderId);
    if (orderToReview) {
      setSelectedOrder(orderToReview);
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleSaveReviewedOrder = useCallback((updatedOrder: Order) => {
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === updatedOrder.id
          ? { ...updatedOrder, status: OrderStatus.PENDING_FACTUSOL }
          : o
      )
    );
    handleCloseModal();
    alert(`Pedido ${updatedOrder.id} revisado y guardado. Listo para exportar a Factusol.`);
  }, []);
  
  const handleSaveNewOrder = useCallback((newOrder: Omit<Order, 'id' | 'date' | 'total'>) => {
    const total = newOrder.items.reduce((acc, item) => {
        const itemTotal = item.quantity * item.price * (1 - item.discount / 100);
        return acc + itemTotal;
    }, 0) * 1.21;

    const maxId = Math.max(0, ...orders.map(o => parseInt(o.id.substring(1))));
    
    const fullNewOrder: Order = {
      ...newOrder,
      id: `#${String(maxId + 1).padStart(5, '0')}`,
      date: new Date().toISOString().split('T')[0],
      total: total,
    };
    setOrders(prevOrders => [fullNewOrder, ...prevOrders]);
    setIsNewOrderModalOpen(false);
    setIsVoiceOrderModalOpen(false);
    alert(`Nuevo pedido ${fullNewOrder.id} creado.`);
  }, [orders]);

  const handleExportToFactusol = (orderId: string) => {
    alert(`Enviando el Albarán ${orderId} con el Cliente y las líneas de detalle revisadas a la API de Factusol...`);
    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId ? { ...o, status: OrderStatus.COMPLETED } : o
      )
    );
    alert(`✅ Albarán ${orderId} creado con éxito en Factusol y marcado como COMPLETO.`);
  };

  const handleViewPdf = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const client = clients.find(c => c.id === order?.clientId);
    if (!order || !client) return;

    const invoiceHtml = `
      <html>
        <head>
          <title>Albarán ${order.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-10 font-sans">
          <div class="max-w-4xl mx-auto bg-white p-8 rounded shadow">
            <div class="flex justify-between items-center border-b pb-4 mb-8">
              <div>
                <h1 class="text-2xl font-bold">ALBARÁN</h1>
                <p class="text-gray-500">Número: ${order.id}</p>
                <p class="text-gray-500">Fecha: ${new Date(order.date).toLocaleDateString('es-ES')}</p>
              </div>
              <div class="text-right">
                <h2 class="text-xl font-bold">Marcelino Calvo S.L.</h2>
                <p class="text-gray-600">CIF: B12345679</p>
                <p class="text-gray-600">Pol. Ind. El Montalvo, Salamanca</p>
              </div>
            </div>
            <div class="mb-8">
              <h3 class="text-lg font-semibold mb-2">Cliente:</h3>
              <p class="font-bold">${client.name}</p>
              <p>${client.address}</p>
              <p>CIF: ${client.cif}</p>
              <p>Email: ${client.email}</p>
            </div>
            <table class="w-full mb-8">
              <thead>
                <tr class="bg-gray-200">
                  <th class="p-2 text-left">Código</th>
                  <th class="p-2 text-left">Concepto</th>
                  <th class="p-2 text-right">Cantidad</th>
                  <th class="p-2 text-right">Precio Unit.</th>
                  <th class="p-2 text-right">Dto.</th>
                  <th class="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr class="border-b">
                    <td class="p-2">${item.code}</td>
                    <td class="p-2">${item.concept}</td>
                    <td class="p-2 text-right">${item.quantity}</td>
                    <td class="p-2 text-right">${item.price.toFixed(2)} €</td>
                    <td class="p-2 text-right">${item.discount.toFixed(2)}%</td>
                    <td class="p-2 text-right font-semibold">${(item.quantity * item.price * (1 - item.discount / 100)).toFixed(2)} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="flex justify-end">
              <div class="w-64">
                <div class="flex justify-between text-gray-700"><p>Base Imponible:</p><p>${(order.total / 1.21).toFixed(2)} €</p></div>
                <div class="flex justify-between text-gray-700"><p>IVA (21%):</p><p>${(order.total - order.total / 1.21).toFixed(2)} €</p></div>
                <div class="flex justify-between font-bold text-xl mt-2 border-t pt-2"><p>TOTAL:</p><p>${order.total.toFixed(2)} €</p></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const pdfWindow = window.open("", "_blank");
    pdfWindow?.document.write(invoiceHtml);
    pdfWindow?.document.close();
  };

  const filteredOrders = useMemo(() =>
    orders.filter(order => filterStatus === 'ALL' || order.status === filterStatus),
    [orders, filterStatus]
  );
  
  const filterOptions: (OrderStatus | 'ALL')[] = ['ALL', ...Object.values(OrderStatus)];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-100 mb-4">Pedidos Procesados (Telegram/Voz)</h2>
      
      <div className="bg-gray-800 p-4 rounded-lg shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-400">Filtrar por estado:</span>
            <div className="flex items-center bg-gray-900 rounded-md p-1 flex-wrap">
                {filterOptions.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            filterStatus === status
                            ? 'bg-gray-600 text-white shadow'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {status === 'ALL' ? 'TODOS' : status}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={() => setIsVoiceOrderModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md flex items-center transition-colors"
                title="Crear un nuevo pedido usando la voz"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 10.5a.5.5 0 01.5.5v1a4 4 0 004 4h0a4 4 0 004-4v-1a.5.5 0 011 0v1a5 5 0 01-4.5 4.975V19h2a.5.5 0 010 1H7a.5.5 0 010-1h2v-2.525A5 5 0 012 12v-1a.5.5 0 01.5-.5z" /></svg>
                Pedido por Voz
            </button>
            <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold py-2 px-4 rounded-md flex items-center transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Nuevo Pedido
            </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total (EUR)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.map(order => {
                const clientName = clients.find(c => c.id === order.clientId)?.name || 'Cliente no encontrado';
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">{order.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{clientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{order.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {order.status === OrderStatus.MANUAL_REVIEW && (
                        <button onClick={() => handleOpenReviewModal(order.id)} className="px-2 py-1 text-xs font-medium rounded-md bg-gray-600 text-gray-100 hover:bg-gray-500">Revisar</button>
                      )}
                      {order.status === OrderStatus.PENDING_FACTUSOL && (
                         <button onClick={() => handleExportToFactusol(order.id)} className="px-2 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Exportar a Factusol</button>
                      )}
                      {order.status === OrderStatus.COMPLETED && (
                        <button onClick={() => handleViewPdf(order.id)} className="px-2 py-1 text-xs font-medium rounded-md text-gray-400 border border-gray-600 hover:bg-gray-700">Ver PDF</button>
                      )}
                      {order.status === OrderStatus.FACTUSOL_ERROR && (
                        <button className="px-2 py-1 text-xs font-medium rounded-md text-gray-400 border border-gray-600 hover:bg-gray-700">Ver Log</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedOrder && (
        <ReviewModal
          order={selectedOrder}
          clients={clients}
          onClose={handleCloseModal}
          onSave={handleSaveReviewedOrder}
        />
      )}
      {isNewOrderModalOpen && (
        <NewOrderModal 
            clients={clients}
            onClose={() => setIsNewOrderModalOpen(false)}
            onSave={handleSaveNewOrder}
        />
      )}
      {isVoiceOrderModalOpen && (
        <VoiceOrderModal
            clients={clients}
            onClose={() => setIsVoiceOrderModalOpen(false)}
            onSave={handleSaveNewOrder}
        />
      )}
    </div>
  );
};