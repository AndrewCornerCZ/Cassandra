import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function PatientDetail({ onLogout, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [examinations, setExaminations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [activeTab, setActiveTab] = useState('examinations');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showExamForm, setShowExamForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [selectedDrugId, setSelectedDrugId] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const patientRes = await api.get(`/patients/${id}`);
      setPatient(patientRes.data);

      const examsRes = await api.get(`/patients/${id}/examinations`);
      setExaminations(examsRes.data);

      const prescsRes = await api.get(`/patients/${id}/prescriptions`);
      setPrescriptions(prescsRes.data);

      const interRes = await api.get(`/patients/${id}/interaction-check`);
      setInteractions(interRes.data);

      const auditRes = await api.get(`/patients/${id}/audit`);
      setAuditLog(auditRes.data);
    } catch (error) {
      setMessage('Chyba při načítání dat pacienta');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExamination = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/patients/${id}/examinations`,
        {
          doctor_id: user.doctor_id,
          doctor_name: user.username,
          diagnosis: e.target.diagnosis.value,
          notes: e.target.notes.value,
          icd10_code: e.target.icd10_code.value,
        }
      );
      setMessage('Vyšetření úspěšně přidáno');
      setShowExamForm(false);
      fetchPatientData();
    } catch (error) {
      setMessage('Chyba při přidávání vyšetření');
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/patients/${id}/prescriptions`,
        {
          drug_id: e.target.drug_id.value,
          drug_name: e.target.drug_name.value,
          dosage: e.target.dosage.value,
          start_date: e.target.start_date.value,
          end_date: e.target.end_date.value,
          prescribed_by: user.username,
        }
      );
      setMessage('Předpis úspěšně přidán');
      setShowPrescriptionForm(false);
      fetchPatientData();
    } catch (error) {
      setMessage('Chyba při přidávání předpisu');
    }
  };

  const handleLogMedication = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/patients/${id}/medications/log`,
        {
          drug_id: e.target.drug_id.value,
          dose_taken: e.target.dose_taken.value,
          administered_by: e.target.administered_by.value,
          notes: e.target.notes.value,
        }
      );
      setMessage('Dávka úspěšně zaznamenána');
      setShowMedicationForm(false);
      
      if (selectedDrugId) {
        const logsRes = await api.get(
          `/patients/${id}/medications/${selectedDrugId}/log?days=30`
        );
        setMedicationLogs(logsRes.data);
      }
    } catch (error) {
      setMessage('Chyba při záznamem dávky');
    }
  };

  const handleLoadMedicationLog = async (drugId) => {
    try {
      setSelectedDrugId(drugId);
      const logsRes = await api.get(
        `/patients/${id}/medications/${drugId}/log?days=30`
      );
      setMedicationLogs(logsRes.data);
    } catch (error) {
      setMessage('Chyba při načítání dávkového protokolu');
    }
  };

  if (loading) {
    return <div className="loading">Načítání...</div>;
  }

  if (!patient) {
    return <div className="error-message">Pacient nenalezen</div>;
  }

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>🏥 MediLog - Detail pacienta</h1>
          <button className="logout-btn" onClick={onLogout}>
            Odhlásit se ({user?.username})
          </button>
        </div>
      </div>

      <div className="container">
        <button onClick={() => navigate('/dashboard')} className="secondary" style={{ marginBottom: '20px' }}>
          ← Zpět na seznam
        </button>

        {message && (
          <div className={message.includes('Chyba') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        {interactions.length > 0 && (
          <div className={`interaction-warning ${interactions.some((i) => i.severity === 'severe') ? 'interaction-severe' : ''}`}>
            <strong>⚠️ Upozornění na interakce:</strong>
            <ul>
              {interactions.map((interaction, idx) => (
                <li key={idx}>
                  <strong>{interaction.drug_id_a}</strong> &harr; <strong>{interaction.drug_id_b}</strong>
                  {': '} {interaction.description} (Závažnost: {interaction.severity})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <h2>Informace o pacientovi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p>
                <strong>Jméno:</strong> {patient.first_name} {patient.last_name}
              </p>
              <p>
                <strong>Rodné číslo:</strong> {patient.national_id}
              </p>
              <p>
                <strong>Datum narození:</strong> {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('cs-CZ') : 'Neuvedeno'}
              </p>
              <p>
                <strong>Krevní skupina:</strong> {patient.blood_type || 'Neuvedena'}
              </p>
            </div>
            <div>
              <p>
                <strong>Telefon:</strong> {patient.phone || 'Neuvedeno'}
              </p>
              <p>
                <strong>Email:</strong> {patient.email || 'Neuvedeno'}
              </p>
              {patient.allergies && patient.allergies.length > 0 && (
                <p>
                  <strong>Alergie:</strong> {patient.allergies.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'examinations' ? 'active' : ''}`}
            onClick={() => setActiveTab('examinations')}
          >
            Vyšetření
          </div>
          <div
            className={`tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Předpisy
          </div>
          <div
            className={`tab ${activeTab === 'medications' ? 'active' : ''}`}
            onClick={() => setActiveTab('medications')}
          >
            Dávkování
          </div>
          <div
            className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit log
          </div>
        </div>

        {activeTab === 'examinations' && (
          <div className="card">
            <h2>Vyšetření</h2>
            {!showExamForm ? (
              <button onClick={() => setShowExamForm(true)}>+ Nové vyšetření</button>
            ) : (
              <form onSubmit={handleAddExamination} style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Diagnóza</label>
                  <input type="text" name="diagnosis" required />
                </div>
                <div className="form-group">
                  <label>Poznámky</label>
                  <textarea name="notes" rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>ICD-10 kód</label>
                  <input type="text" name="icd10_code" />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit">Uložit vyšetření</button>
                  <button type="button" className="secondary" onClick={() => setShowExamForm(false)}>
                    Zrušit
                  </button>
                </div>
              </form>
            )}

            {examinations.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Datum vyšetření</th>
                    <th>Lékař</th>
                    <th>Diagnóza</th>
                    <th>ICD-10</th>
                  </tr>
                </thead>
                <tbody>
                  {examinations.map((exam) => (
                    <tr key={exam.exam_id}>
                      <td>{new Date(exam.examined_at).toLocaleDateString('cs-CZ')}</td>
                      <td>{exam.doctor_name}</td>
                      <td>{exam.diagnosis}</td>
                      <td>{exam.icd10_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Žádná vyšetření zaznam</p>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="card">
            <h2>Předpisy</h2>
            {!showPrescriptionForm ? (
              <button onClick={() => setShowPrescriptionForm(true)}>+ Nový předpis</button>
            ) : (
              <form onSubmit={handleAddPrescription} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>ID léku</label>
                    <input type="text" name="drug_id" required />
                  </div>
                  <div className="form-group">
                    <label>Název léku</label>
                    <input type="text" name="drug_name" required />
                  </div>
                  <div className="form-group">
                    <label>Dávkování</label>
                    <input type="text" name="dosage" required />
                  </div>
                  <div className="form-group">
                    <label>Počátek</label>
                    <input type="date" name="start_date" required />
                  </div>
                  <div className="form-group">
                    <label>Konec</label>
                    <input type="date" name="end_date" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit">Uložit předpis</button>
                  <button type="button" className="secondary" onClick={() => setShowPrescriptionForm(false)}>
                    Zrušit
                  </button>
                </div>
              </form>
            )}

            {prescriptions.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Lék</th>
                    <th>Dávkování</th>
                    <th>Počátek</th>
                    <th>Konec</th>
                    <th>Aktivní</th>
                    <th>Zaznamenáno</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((presc) => (
                    <tr key={`${presc.drug_id}-${presc.start_date}`}>
                      <td>{presc.drug_name}</td>
                      <td>{presc.dosage}</td>
                      <td>{new Date(presc.start_date).toLocaleDateString('cs-CZ')}</td>
                      <td>{presc.end_date ? new Date(presc.end_date).toLocaleDateString('cs-CZ') : '-'}</td>
                      <td>{presc.active ? '✓' : '✗'}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleLoadMedicationLog(presc.drug_id)}
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Zobrazit záznam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Žádné aktivní předpisy</p>
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="card">
            <h2>Dávkování</h2>
            {!showMedicationForm ? (
              <button onClick={() => setShowMedicationForm(true)}>+ Zaznamenat dávku</button>
            ) : (
              <form onSubmit={handleLogMedication} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>ID léku</label>
                    <input type="text" name="drug_id" required />
                  </div>
                  <div className="form-group">
                    <label>Dávka</label>
                    <input type="text" name="dose_taken" required />
                  </div>
                  <div className="form-group">
                    <label>Podáno</label>
                    <input type="text" name="administered_by" required />
                  </div>
                  <div className="form-group">
                    <label>Poznámky</label>
                    <input type="text" name="notes" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit">Zaznamenat dávku</button>
                  <button type="button" className="secondary" onClick={() => setShowMedicationForm(false)}>
                    Zrušit
                  </button>
                </div>
              </form>
            )}

            {medicationLogs.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Lék ID</th>
                    <th>Dávka</th>
                    <th>Podáno</th>
                    <th>Poznámky</th>
                  </tr>
                </thead>
                <tbody>
                  {medicationLogs.map((log) => (
                    <tr key={`${log.drug_id}-${log.taken_at}`}>
                      <td>{new Date(log.taken_at).toLocaleDateString('cs-CZ')}</td>
                      <td>{log.drug_id}</td>
                      <td>{log.dose_taken}</td>
                      <td>{log.administered_by}</td>
                      <td>{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Žádné zaznamenané dávky</p>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="card">
            <h2>Audit Log</h2>
            {auditLog.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Čas</th>
                    <th>Akce</th>
                    <th>Uživatel</th>
                    <th>Entita</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log) => (
                    <tr key={log.event_id}>
                      <td>{new Date(log.event_at).toLocaleDateString('cs-CZ')}</td>
                      <td>{log.action}</td>
                      <td>{log.actor_name}</td>
                      <td>{log.entity_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Žádné audit záznam</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDetail;
