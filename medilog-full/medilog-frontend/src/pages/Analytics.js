import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Analytics({ onLogout, user }) {
  const navigate = useNavigate();
  const [prescriptionStats, setPrescriptionStats] = useState([]);
  const [diagnosisStats, setDiagnosisStats] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const prescsRes = await api.get(`/analytics/prescriptions?month=${selectedMonth}`);
      setPrescriptionStats(prescsRes.data);

      const diagRes = await api.get(`/analytics/diagnoses?month=${selectedMonth}`);
      setDiagnosisStats(diagRes.data);
    } catch (error) {
      setMessage('Chyba při načítání analytiky');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const totalPrescriptions = prescriptionStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalDiagnoses = diagnosisStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>🏥 MediLog - Analytika</h1>
          <div className="nav">
            <a href="/dashboard">Pacienti</a>
            {user?.role === 'doctor' && <a href="/appointments">Termíny</a>}
            <a href="/analytics">Analytika</a>
            <button className="logout-btn" onClick={handleLogout}>
              Odhlásit se ({user?.username})
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {message && (
          <div className={message.includes('Chyba') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <div className="card">
          <h2>Výběr měsíce</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <button onClick={fetchAnalytics}>Aktualizovat</button>
          </div>
        </div>

        <div className="grid">
          <div className="stat-card">
            <h3>Celkem předpisů</h3>
            <div className="value">{totalPrescriptions}</div>
          </div>
          <div className="stat-card">
            <h3>Počet diagnóz</h3>
            <div className="value">{totalDiagnoses}</div>
          </div>
          <div className="stat-card">
            <h3>Měsíc</h3>
            <div className="value">{selectedMonth}</div>
          </div>
        </div>

        <div className="card">
          <h2>Statistika předepsaných léků</h2>
          {loading ? (
            <div className="loading">Načítání...</div>
          ) : prescriptionStats.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Lék</th>
                  <th>ID</th>
                  <th>Počet předpisů</th>
                </tr>
              </thead>
              <tbody>
                {prescriptionStats.map((stat) => (
                  <tr key={stat.drug_id}>
                    <td>{stat.drug_name}</td>
                    <td>{stat.drug_id}</td>
                    <td>
                      <strong>{stat.count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Žádné předpisy na tento měsíc</p>
          )}
        </div>

        <div className="card">
          <h2>Statistika diagnóz</h2>
          {loading ? (
            <div className="loading">Načítání...</div>
          ) : diagnosisStats.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>ICD-10 kód</th>
                  <th>Počet diagnóz</th>
                </tr>
              </thead>
              <tbody>
                {diagnosisStats.map((stat) => (
                  <tr key={stat.icd10_code}>
                    <td>{stat.icd10_code}</td>
                    <td>
                      <strong>{stat.count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Žádné diagnózy na tento měsíc</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
