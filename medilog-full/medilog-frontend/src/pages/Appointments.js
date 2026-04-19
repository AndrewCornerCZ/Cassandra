import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Appointments({ onLogout, user }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient_name: '',
    patient_id: '',
    start_time: '',
    reason: '',
  });

  useEffect(() => {
    if (user?.doctor_id) {
      fetchAppointments();
    }
  }, [selectedDate, user]);

  const fetchAppointments = async () => {
    if (!user?.doctor_id) return;
    setLoading(true);
    try {
      const response = await api.get(
        `/doctors/${user.doctor_id}/appointments?date=${selectedDate}`
      );
      setAppointments(response.data);
    } catch (error) {
      setMessage('Chyba při načítání termínů');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAppointmentChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment({ ...newAppointment, [name]: value });
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/appointments',
        {
          doctor_id: user.doctor_id,
          appt_date: selectedDate,
          ...newAppointment,
          status: 'scheduled',
        }
      );
      setMessage('Termín úspěšně vytvořen');
      setShowNewAppointmentForm(false);
      setNewAppointment({ patient_name: '', patient_id: '', start_time: '', reason: '' });
      fetchAppointments();
    } catch (error) {
      setMessage('Chyba při vytváření termínu');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>🏥 MediLog - Moje termíny</h1>
          <div className="nav">
            <a href="/dashboard">Pacienti</a>
            <a href="/appointments">Termíny</a>
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
          <h2>Výběr data</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button onClick={fetchAppointments}>Načíst termíny</button>
          </div>
        </div>

        {!showNewAppointmentForm ? (
          <button onClick={() => setShowNewAppointmentForm(true)} style={{ marginBottom: '20px' }}>
            + Nový termín
          </button>
        ) : (
          <div className="card">
            <h2>Nový termín</h2>
            <form onSubmit={handleCreateAppointment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Jméno pacienta</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={newAppointment.patient_name}
                    onChange={handleNewAppointmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ID pacienta</label>
                  <input
                    type="text"
                    name="patient_id"
                    value={newAppointment.patient_id}
                    onChange={handleNewAppointmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Čas</label>
                  <input
                    type="time"
                    name="start_time"
                    value={newAppointment.start_time}
                    onChange={handleNewAppointmentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Důvod návštěvy</label>
                  <input
                    type="text"
                    name="reason"
                    value={newAppointment.reason}
                    onChange={handleNewAppointmentChange}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit">Vytvořit termín</button>
                <button type="button" className="secondary" onClick={() => setShowNewAppointmentForm(false)}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2>Termíny na {new Date(selectedDate).toLocaleDateString('cs-CZ')}</h2>
          {loading ? (
            <div className="loading">Načítání...</div>
          ) : appointments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Čas</th>
                  <th>Pacient</th>
                  <th>Důvod</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.appt_id}>
                    <td>{appt.start_time}</td>
                    <td>{appt.patient_name}</td>
                    <td>{appt.reason}</td>
                    <td>{appt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Žádné termíny na tento den</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Appointments;
