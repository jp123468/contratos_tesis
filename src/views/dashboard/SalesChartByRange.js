import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../firebase/firebase_settings';
import { Row, Col, Form } from "react-bootstrap"

// Inicializa Firebase
initializeApp(firebaseConfig);
const db = getFirestore();
const SalesChartByRange = ({ userRole, currentUserId }) => {
  const canvasRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const chartInstanceRef = useRef(null);
  const [user, setUsers] = useState([]);



  const fetchChartData = async (start, end) => {
    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;
    if (endDateObj) endDateObj.setHours(23, 59, 59, 999);
  
    const [usersSnapshot, contractsSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "contracts"))
    ]);
  
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(users);
    
    // Filtrar usuarios según rol para usar en datasets y etiquetas
    const filteredUsers = userRole === 'vendedor'
      ? users.filter(u => u.id === currentUserId)
      : users;
  
    setUsers(filteredUsers); // guarda solo los usuarios visibles
  
    const contracts = contractsSnapshot.docs.map(doc => doc.data());
  
    // Filtrar contratos según rango de fecha y rol
    const filteredContracts = contracts.filter(contract => {
      const contractDate = contract.date ? new Date(contract.date) : null;
      if (!contractDate) return false;
    
      // ✅ Validaciones requeridas:
      if (!contract.contractCodeaprov || contract.contractCodeaprov === '0') return false;
      if (!contract.signatureUrl || contract.signatureUrl.trim() === '') return false;
    
      // ✅ Restricción por rol:
      if (userRole === 'vendedor' && contract.id_vent !== currentUserId) return false;
    
      if (startDateObj && contractDate < startDateObj) return false;
      if (endDateObj && contractDate > endDateObj) return false;
    
      return true;
    });
    
  
    // Obtener meses únicos para etiquetas
    const monthsSet = new Set();
    filteredContracts.forEach(contract => {
      const date = new Date(contract.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthsSet.add(key);
    });
  
    const sortedMonths = Array.from(monthsSet).sort();
  
    // Etiquetas legibles para eje X
    const labels = sortedMonths.map(k => {
      const [y, m] = k.split('-');
      return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    });
  
    // Colores predefinidos para usuarios
    const colors = [
      'rgba(255, 99, 71, 0.7)',      // Tomato rojo
      'rgba(60, 179, 113, 0.7)',     // MediumSeaGreen
      'rgba(255, 215, 0, 0.7)',      // Gold
      'rgba(138, 43, 226, 0.7)',     // BlueViolet
      'rgba(255, 140, 0, 0.7)',      // DarkOrange
      'rgba(70, 130, 180, 0.7)',     // SteelBlue
    ];
  
    // Función para generar colores aleatorios si hay más usuarios que colores
    const generateDistinctColor = () => {
      const r = Math.floor(Math.random() * 205) + 50;
      const g = Math.floor(Math.random() * 205) + 50;
      const b = Math.floor(Math.random() * 205) + 50;
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    };
  
    // Construir datasets solo para usuarios filtrados
    const datasets = filteredUsers.map((user, idx) => {
      const data = sortedMonths.map(monthKey => {
        return filteredContracts
          .filter(contract => {
            if (contract.id_vent !== user.id) return false;
            if (!contract.date) return false;
            const d = new Date(contract.date);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            return key === monthKey;
          })
          .reduce((sum, contract) => sum + (parseFloat(contract.valorPactadoHoy) || 0), 0);
      });
  
      return {
        label: user.firstName || `Usuario ${idx + 1}`,
        data,
        backgroundColor: colors[idx] || generateDistinctColor(),
      };
    });
  
    // Total general de ventas
    const total = filteredContracts.reduce((sum, contract) => {
      if (userRole === 'vendedor') {
        return contract.id_vent === currentUserId
          ? sum + (parseFloat(contract.valorPactadoHoy) || 0)
          : sum;
      }
      return sum + (parseFloat(contract.valorPactadoHoy) || 0);
    }, 0);
  
    setTotalSales(total);
  
    // Destruir instancia previa para evitar error de canvas
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
  
    // Crear nuevo gráfico
    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Mes' },
            stacked: true,
          },
          y: {
            type: 'linear',
            beginAtZero: true,
            title: { display: true, text: 'Monto ($)' },
            stacked: true,
          }
        },
        plugins: {
          tooltip: {
            enabled: true,
            callbacks: {
              label: function (context) {
                const datasetIndex = context.datasetIndex;
                const dataIndex = context.dataIndex;
                const user = filteredUsers[datasetIndex];
                const monthKey = sortedMonths[dataIndex];
  
                const contractCount = filteredContracts.filter(contract => {
                  if (contract.id_vent !== user.id) return false;
                  if (!contract.date) return false;
                  const d = new Date(contract.date);
                  const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                  return key === monthKey;
                }).length;
  
                const value = context.parsed.y || 0;
  
                return [
                  `Ventas: $${value.toFixed(2)}`,
                  `Contratos: ${contractCount}`
                ];
              }
            }
          }
        }
      }
    });
  };
  



  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    fetchChartData(startDate, endDate);
  }, [startDate, endDate]);

  const numericTotalSales = Number(totalSales);

  return (
    <div className="card-body py-4" style={{ minHeight: "450px" }}>
      <div className="text-center mb-4">
        <span className="fw-bold fs-1">${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>    <div className="fs-5 text-muted">Ventas Totales en el Rango</div>
        <div className="text-success mt-2">
          <i className="fas fa-calendar-alt fa-lg"></i>
        </div>
      </div>

      <Row className="mb-4 justify-content-center text-center">
        <Col xs={12}>
          <div className="text-muted fst-italic fs-6">Rango seleccionado</div>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        <Col xs={12} md={6}>
          <Form.Group controlId="startDate">
            <Form.Label className="fw-semibold">Desde:</Form.Label>
            <Form.Control
              type="date"
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col xs={12} md={6}>
          <Form.Group controlId="endDate">
            <Form.Label className="fw-semibold">Hasta:</Form.Label>
            <Form.Control
              type="date"
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>


      <div
        className="position-relative mb-4"
        style={{
          minHeight: "300px",  // altura mínima un poco más baja
          height: `${Math.min(700, Math.max(300, numericTotalSales / 6))}px`, // escala más suave y límite más bajo
          transition: "height 0.4s ease",
        }}
      >
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default SalesChartByRange;