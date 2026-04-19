import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Dashboard({ onLogout, user }) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLastName, setSearchLastName] = useState('');
  const [searchNationalId, setSearchNationalId] = useState('');
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    national_id: '',
    blood_type: 'O+',
    allergies: '',
    phone: '',
    email: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let url = '/patients';
      const params = [];
      if (searchLastName) params.push(`lastName=${searchLastName}`);
      if (searchNationalId) params.push(`nationalId=${searchNationalId}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await api.get(url);
      setPatients(response.data);
    } catch (error) {
      setMessage('Chyba při načítání pacientů');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatient({ ...newPatient, [name]: value });
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const allergies = newPatient.allergies ? newPatient.allergies.split(',').map((a) => a.trim()) : [];
      await api.post(
        '/patients',
        {
          ...newPatient,
          allergies,
        }
      );
      setMessage('Pacient úspěšně vytvořen');
      setShowNewPatientForm(false);
      setNewPatient({
        first_name: '',
        last_name: '',
        birth_date: '',
        national_id: '',
        blood_type: 'O+',
        allergies: '',
        phone: '',
        email: '',
      });
      fetchPatients();
    } catch (error) {
      setMessage('Chyba při vytváření pacienta');
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
          <h1>🏥 MediLog - Palubní deska</h1>
          <div className="nav">
            <Link to="/dashboard">Pacienti</Link>
            {user?.role === 'doctor' && <Link to="/appointments">Termíny</Link>}
            <Link to="/analytics">Analytika</Link>
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
          <h2>Vyhledání pacientů</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Příjmení"
              value={searchLastName}
              onChange={(e) => setSearchLastName(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Rodné číslo"
              value={searchNationalId}
              onChange={(e) => setSearchNationalId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit">Hledat</button>
          </form>
        </div>

        {!showNewPatientForm ? (
          <button onClick={() => setShowNewPatientForm(true)} style={{ marginBottom: '20px' }}>
            + Nový pacient
          </button>
        ) : (
          <div className="card">
            <h2>Nový pacient</h2>
            <form onSubmit={handleCreatePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Jméno *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={newPatient.first_name}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Příjmení *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={newPatient.last_name}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rodné číslo *</label>
                  <input
                    type="text"
                    name="national_id"
                    value={newPatient.national_id}
                    onChange={handleNewPatientChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Datum narození</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={newPatient.birth_date}
                    onChange={handleNewPatientChange}
                  />
                </div>
                <div className="form-group">
                  <label>Krevní skupina</label>
                  <select name="blood_type" value={newPatient.blood_type} onChange={handleNewPatientChange}>
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newPatient.phone}
                    onChange={handleNewPatientChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newPatient.email}
                    onChange={handleNewPatientChange}
                  />
                </div>
                <div className="form-group">
                  <label>Alergie (oddělené čárkami)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={newPatient.allergies}
                    onChange={handleNewPatientChange}
                    placeholder="např. Penicilín, Aspirin"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit">Vytvořit pacienta</button>
                <button type="button" className="secondary" onClick={() => setShowNewPatientForm(false)}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h2>Seznam pacientů ({patients.length})</h2>
          {loading ? (
            <div className="loading">Načítání...</div>
          ) : patients.length > 0 ? (
            <ul className="patient-list">
              {patients.map((patient) => (
                <li
                  key={patient.patient_id}
                  className="patient-item"
                  onClick={() => navigate(`/patients/${patient.patient_id}`)}
                >
                  <h3>
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p>
                    <strong>Rodné číslo:</strong> {patient.national_id}
                  </p>
                  <p>
                    <strong>Krevní skupina:</strong> {patient.blood_type || 'Neuvedena'}
                  </p>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <p>
                      <strong>Alergie:</strong> {patient.allergies.join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Žádní pacienti nemapovani</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
