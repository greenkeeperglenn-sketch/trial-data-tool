import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, BarChart3, Grid, List, Eye, ChevronLeft, ChevronRight, Camera, FileText, X } from 'lucide-react';

const TrialDataTool = () => {
  const [step, setStep] = useState('library');
  const [currentTrialId, setCurrentTrialId] = useState(null);
  const [trials, setTrials] = useState({});
  const [config, setConfig] = useState({
    trialName: '',
    numBlocks: 4,
    numTreatments: 3,
    numReps: 1,
    treatments: ['Treatment A', 'Treatment B', 'Treatment C'],
    assessmentTypes: [
      { name: 'Turf Quality', min: 1, max: 10 },
      { name: 'Turf Color', min: 1, max: 10 },
      { name: 'NDVI', min: 0, max: 1 }
    ]
  });
  const [layout, setLayout] = useState([]);
  const [assessmentDates, setAssessmentDates] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [viewMode, setViewMode] = useState('field');
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [showTreatments, setShowTreatments] = useState(false);
  const [photos, setPhotos] = useState({});
  const [notes, setNotes] = useState({});
  // Load trials from localStorage on mount
  useEffect(() => {
    const savedTrials = localStorage.getItem('trials');
    if (savedTrials) {
      setTrials(JSON.parse(savedTrials));
    }
  }, []);

  // Save trials to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(trials).length > 0) {
      localStorage.setItem('trials', JSON.stringify(trials));
    }
  }, [trials]);

  // Save current trial data
  const saveCurrentTrial = () => {
    if (!currentTrialId) return;
    const trialData = {
      id: currentTrialId,
      name: config.trialName,
      config,
      layout,
      assessmentDates,
      photos,
      notes,
      lastModified: new Date().toISOString(),
      created: trials[currentTrialId]?.created || new Date().toISOString()
    };
    setTrials(prev => ({ ...prev, [currentTrialId]: trialData }));
  };

  // Auto-save when data changes
  useEffect(() => {
    if (currentTrialId && layout.length > 0) {
      saveCurrentTrial();
    }
  }, [config, layout, assessmentDates, photos, notes]);
  const createNewTrial = () => {
    const id = Date.now().toString();
    setCurrentTrialId(id);
    setConfig({
      trialName: 'New Trial',
      numBlocks: 4,
      numTreatments: 3,
      numReps: 1,
      treatments: ['Treatment A', 'Treatment B', 'Treatment C'],
      assessmentTypes: [
        { name: 'Turf Quality', min: 1, max: 10 },
        { name: 'Turf Color', min: 1, max: 10 },
        { name: 'NDVI', min: 0, max: 1 }
      ]
    });
    setLayout([]);
    setAssessmentDates([]);
    setPhotos({});
    setNotes({});
    setStep('setup');
  };

  const loadTrial = (trialId) => {
    const trial = trials[trialId];
    if (!trial) return;
    setCurrentTrialId(trialId);
    setConfig(trial.config);
    setLayout(trial.layout);
    setAssessmentDates(trial.assessmentDates);
    setPhotos(trial.photos || {});
    setNotes(trial.notes || {});
    setSelectedAssessmentType(trial.config.assessmentTypes[0]?.name || '');
    setStep('entry');
  };

  const deleteTrial = (trialId) => {
    if (confirm('Delete this trial? This cannot be undone.')) {
      setTrials(prev => {
        const newTrials = { ...prev };
        delete newTrials[trialId];
        return newTrials;
      });
    }
  };
 const exportTrialJSON = () => {
    const trial = trials[currentTrialId];
    if (!trial) return;
    const dataStr = JSON.stringify(trial, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.trialName.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTrialJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const newId = Date.now().toString();
        imported.id = newId;
        imported.lastModified = new Date().toISOString();
        setTrials(prev => ({ ...prev, [newId]: imported }));
        alert('Trial imported successfully!');
      } catch (err) {
        alert('Error importing trial. Check file format.');
      }
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    if (!selectedAssessmentType) return;
    let csv = 'Plot,Block,Treatment';
    assessmentDates.forEach(d => csv += `,${d.date}`);
    csv += '\n';
    layout.flat().forEach(plot => {
      csv += `${plot.plot},${plot.block},${plot.treatmentName}`;
      assessmentDates.forEach(dateObj => {
        const value = dateObj.assessments[selectedAssessmentType][plot.plot]?.value || '';
        csv += `,${value}`;
      });
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.trialName}_${selectedAssessmentType}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryCSV = () => {
    if (!selectedAssessmentType) return;
    let csv = 'Treatment';
    assessmentDates.forEach(d => csv += `,${d.date}_Mean,${d.date}_SE`);
    csv += '\n';
    config.treatments.forEach((treatment, treatmentIdx) => {
      csv += treatment;
      assessmentDates.forEach(dateObj => {
        const treatmentValues = layout.flat()
          .filter(plot => plot.treatment === treatmentIdx)
          .map(plot => {
            const plotData = dateObj.assessments[selectedAssessmentType][plot.plot];
            return plotData?.entered && plotData.value !== '' ? parseFloat(plotData.value) : null;
          })
          .filter(v => v !== null);
        if (treatmentValues.length === 0) {
          csv += ',,';
        } else {
          const mean = treatmentValues.reduce((a, b) => a + b, 0) / treatmentValues.length;
          const variance = treatmentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / treatmentValues.length;
          const stdError = Math.sqrt(variance / treatmentValues.length);
          csv += `,${mean.toFixed(2)},${stdError.toFixed(2)}`;
        }
      });
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.trialName}_${selectedAssessmentType}_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }; 
  const generateLayout = () => {
    const newLayout = [];
    for (let block = 1; block <= config.numBlocks; block++) {
      const blockPlots = [];
      const treatments = [...Array(config.numTreatments).keys()];
      for (let rep = 0; rep < config.numReps; rep++) {
        const shuffled = [...treatments].sort(() => Math.random() - 0.5);
        shuffled.forEach(treatmentIdx => {
          blockPlots.push({
            block,
            treatment: treatmentIdx,
            treatmentName: config.treatments[treatmentIdx],
            plot: `B${block}-T${treatmentIdx + 1}-R${rep + 1}`
          });
        });
      }
      newLayout.push(blockPlots);
    }
    setLayout(newLayout);
    setStep('entry');
  };

  const addAssessmentDate = () => {
    if (!currentDate) return;
    const newDate = { date: currentDate, assessments: {} };
    config.assessmentTypes.forEach(type => {
      newDate.assessments[type.name] = {};
      layout.forEach(block => {
        block.forEach(plot => {
          newDate.assessments[type.name][plot.plot] = { value: '', entered: false };
        });
      });
    });
    setAssessmentDates([...assessmentDates, newDate]);
    setCurrentDate('');
    setCurrentDateIndex(assessmentDates.length);
    if (!selectedAssessmentType && config.assessmentTypes.length > 0) {
      setSelectedAssessmentType(config.assessmentTypes[0].name);
    }
  };

  const updateData = (date, assessmentType, plotId, value) => {
    setAssessmentDates(prevDates => 
      prevDates.map(d => {
        if (d.date === date) {
          return {
            ...d,
            assessments: {
              ...d.assessments,
              [assessmentType]: {
                ...d.assessments[assessmentType],
                [plotId]: { value, entered: value !== '' }
              }
            }
          };
        }
        return d;
      })
    );
  };

  const generateTestData = () => {
    if (!currentDateObj || !selectedAssessmentType) return;
    const assessment = config.assessmentTypes.find(a => a.name === selectedAssessmentType);
    if (!assessment) return;
    const bestTreatment = Math.floor(Math.random() * config.numTreatments);
    const updatedDate = { ...currentDateObj };
    layout.flat().forEach(plot => {
      const range = assessment.max - assessment.min;
      const midPoint = assessment.min + (range * 0.6);
      let value;
      if (plot.treatment === bestTreatment) {
        value = midPoint + (range * 0.15) + (Math.random() * range * 0.15);
      } else {
        value = midPoint - (range * 0.1) + (Math.random() * range * 0.25);
      }
      value = Math.max(assessment.min, Math.min(assessment.max, Math.round(value * 10) / 10));
      updatedDate.assessments[selectedAssessmentType][plot.plot] = {
        value: value.toString(),
        entered: true
      };
    });
    setAssessmentDates(prevDates => 
      prevDates.map(d => d.date === currentDateObj.date ? updatedDate : d)
    );
  };
  const handlePhotoUpload = (plotId, dateStr, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const key = `${dateStr}_${plotId}`;
      setPhotos(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), event.target.result]
      }));
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = (plotId, dateStr, photoIndex) => {
    const key = `${dateStr}_${plotId}`;
    setPhotos(prev => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== photoIndex)
    }));
  };

  const updateNotes = (dateStr, assessmentType, value) => {
    const key = `${dateStr}_${assessmentType}`;
    setNotes(prev => ({ ...prev, [key]: value }));
  };
 const getValueColor = (value, assessmentType, dateObj) => {
    if (!value || value === '') return 'bg-white border-gray-300';
    const numValue = parseFloat(value);
    const allValues = Object.values(dateObj.assessments[assessmentType])
      .filter(v => v.entered && v.value !== '')
      .map(v => parseFloat(v.value));
    if (allValues.length === 0) return 'bg-white border-gray-300';
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    if (range === 0) return 'bg-yellow-300 border-yellow-500';
    const normalized = Math.max(0, Math.min(1, (numValue - min) / range));
    if (normalized < 0.1) return 'bg-red-300 border-red-500';
    else if (normalized < 0.2) return 'bg-red-200 border-red-400';
    else if (normalized < 0.3) return 'bg-orange-300 border-orange-500';
    else if (normalized < 0.4) return 'bg-orange-200 border-orange-400';
    else if (normalized < 0.5) return 'bg-yellow-300 border-yellow-500';
    else if (normalized < 0.6) return 'bg-yellow-200 border-yellow-400';
    else if (normalized < 0.7) return 'bg-lime-300 border-lime-500';
    else if (normalized < 0.8) return 'bg-green-200 border-green-400';
    else if (normalized < 0.9) return 'bg-green-300 border-green-500';
    else return 'bg-green-400 border-green-600';
  };

  const calculateStats = (dateObj, assessmentType) => {
    const assessmentData = dateObj.assessments[assessmentType];
    const values = Object.entries(assessmentData)
      .filter(([_, v]) => v.entered && !isNaN(parseFloat(v.value)))
      .map(([plotId, v]) => {
        const plot = layout.flat().find(p => p.plot === plotId);
        return { treatment: plot.treatment, value: parseFloat(v.value) };
      });
    if (values.length === 0) return null;
    const treatmentGroups = {};
    values.forEach(v => {
      if (!treatmentGroups[v.treatment]) treatmentGroups[v.treatment] = [];
      treatmentGroups[v.treatment].push(v.value);
    });
    const means = Object.entries(treatmentGroups).map(([treatment, vals]) => ({
      treatment: parseInt(treatment),
      treatmentName: config.treatments[treatment],
      mean: vals.reduce((a, b) => a + b, 0) / vals.length,
      n: vals.length,
      values: vals
    }));
    const grandMean = values.reduce((a, b) => a + b.value, 0) / values.length;
    let ssTreatment = 0;
    means.forEach(m => {
      ssTreatment += m.n * Math.pow(m.mean - grandMean, 2);
    });
    let ssError = 0;
    values.forEach(v => {
      const treatmentMean = means.find(m => m.treatment === v.treatment).mean;
      ssError += Math.pow(v.value - treatmentMean, 2);
    });
    const dfTreatment = config.numTreatments - 1;
    const dfError = values.length - config.numTreatments;
    const msTreatment = ssTreatment / dfTreatment;
    const msError = ssError / dfError;
    const fValue = msTreatment / msError;
    const fCritical = 3.0;
    const significant = fValue > fCritical;
    const lsd = 1.96 * Math.sqrt(2 * msError / (config.numBlocks * config.numReps));
    const sortedMeans = [...means].sort((a, b) => b.mean - a.mean);
    const groups = [];
    sortedMeans.forEach((mean, idx) => {
      let group = String.fromCharCode(97 + idx);
      for (let i = 0; i < idx; i++) {
        if (Math.abs(mean.mean - sortedMeans[i].mean) <= lsd) {
          group = String.fromCharCode(97 + i);
          break;
        }
      }
      groups.push({ ...mean, group });
    });
    return {
      means: groups,
      fValue: fValue.toFixed(2),
      significant,
      lsd: lsd.toFixed(2),
      msError: msError.toFixed(2)
    };
  };
  const currentDateObj = assessmentDates[currentDateIndex];
 if (step === 'library') {
    const trialList = Object.values(trials).sort((a, b) => 
      new Date(b.lastModified) - new Date(a.lastModified)
    );
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Trial Library</h1>
          <p className="text-gray-600">Manage your field trials</p>
        </div>
        <div className="mb-6 flex gap-2 flex-wrap">
          <button onClick={createNewTrial} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={20} /> Create New Trial
          </button>
          <label className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
            <Upload size={20} /> Import Trial
            <input type="file" accept=".json" onChange={importTrialJSON} className="hidden" />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trialList.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No trials yet. Create your first trial!</p>
            </div>
          ) : (
            trialList.map(trial => (
              <div key={trial.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">{trial.name}</h3>
                  <button onClick={() => deleteTrial(trial.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>Blocks: {trial.config.numBlocks} | Treatments: {trial.config.numTreatments}</div>
                  <div>Assessments: {trial.assessmentDates.length}</div>
                  <div>Modified: {new Date(trial.lastModified).toLocaleDateString()}</div>
                </div>
                <button onClick={() => loadTrial(trial.id)} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                  Open Trial
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  } 
  if (step === 'setup') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Trial Setup</h1>
          <button onClick={() => setStep('library')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            ← Library
          </button>
        </div>
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-2">Trial Name</label>
            <input
              type="text"
              value={config.trialName}
              onChange={(e) => setConfig({...config, trialName: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="e.g., Summer 2025 Turf Quality Study"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Number of Blocks</label>
            <input
              type="number"
              value={config.numBlocks}
              onChange={(e) => setConfig({...config, numBlocks: parseInt(e.target.value) || 0})}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Number of Treatments</label>
            <input
              type="number"
              value={config.numTreatments}
              onChange={(e) => {
                const num = parseInt(e.target.value) || 0;
                const newTreatments = Array(num).fill(0).map((_, i) => 
                  config.treatments[i] || `Treatment ${String.fromCharCode(65 + i)}`
                );
                setConfig({...config, numTreatments: num, treatments: newTreatments});
              }}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Replicates per Treatment (per block)</label>
            <input
              type="number"
              value={config.numReps}
              onChange={(e) => setConfig({...config, numReps: parseInt(e.target.value) || 1})}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Treatment Names</label>
            <div className="space-y-2">
              {config.treatments.map((treatment, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={treatment}
                  onChange={(e) => {
                    const newTreatments = [...config.treatments];
                    newTreatments[idx] = e.target.value;
                    setConfig({...config, treatments: newTreatments});
                  }}
                  className="w-full p-2 border rounded"
                  placeholder={`Treatment ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Assessment Types</label>
            <div className="space-y-2">
              {config.assessmentTypes.map((type, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={type.name}
                      onChange={(e) => {
                        const newTypes = [...config.assessmentTypes];
                        newTypes[idx] = { ...newTypes[idx], name: e.target.value };
                        setConfig({...config, assessmentTypes: newTypes});
                      }}
                      className="w-full p-2 border rounded"
                      placeholder="Assessment name"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-600">Min</label>
                    <input
                      type="number"
                      step="0.1"
                      value={type.min}
                      onChange={(e) => {
                        const newTypes = [...config.assessmentTypes];
                        newTypes[idx] = { ...newTypes[idx], min: parseFloat(e.target.value) || 0 };
                        setConfig({...config, assessmentTypes: newTypes});
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-600">Max</label>
                    <input
                      type="number"
                      step="0.1"
                      value={type.max}
                      onChange={(e) => {
                        const newTypes = [...config.assessmentTypes];
                        newTypes[idx] = { ...newTypes[idx], max: parseFloat(e.target.value) || 10 };
                        setConfig({...config, assessmentTypes: newTypes});
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newTypes = config.assessmentTypes.filter((_, i) => i !== idx);
                      setConfig({...config, assessmentTypes: newTypes});
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setConfig({
                  ...config, 
                  assessmentTypes: [...config.assessmentTypes, { name: `Assessment ${config.assessmentTypes.length + 1}`, min: 1, max: 10 }]
                })}
                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 p-2 rounded"
              >
                <Plus size={20} /> Add Assessment Type
              </button>
            </div>
          </div>
          <button onClick={generateLayout} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
            Generate Trial Layout
          </button>
        </div>
      </div>
    );
  }
  // Data Entry View
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{config.trialName}</h1>
          <p className="text-sm text-gray-600">Auto-saved</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            <Download size={16} /> Export Data
          </button>
          <button onClick={exportSummaryCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            <Download size={16} /> Summary
          </button>
          <button onClick={exportTrialJSON} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
            <Download size={16} /> Backup
          </button>
          <button onClick={() => { saveCurrentTrial(); setStep('library'); }} className="px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">
            ← Library
          </button>
        </div>
      </div>

      {/* Add Assessment Date */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Add Assessment Date</label>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <button onClick={addAssessmentDate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
            <Plus size={20} /> Add Date
          </button>
        </div>
      </div>

      {assessmentDates.length > 0 && (
        <>
          {/* Date Navigation */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentDateIndex(Math.max(0, currentDateIndex - 1))}
                disabled={currentDateIndex === 0}
                className={`p-2 rounded ${currentDateIndex === 0 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                <div className="text-xl font-bold">{currentDateObj?.date}</div>
                <div className="text-sm text-gray-600">Assessment {currentDateIndex + 1} of {assessmentDates.length}</div>
              </div>
              <button
                onClick={() => setCurrentDateIndex(Math.min(assessmentDates.length - 1, currentDateIndex + 1))}
                disabled={currentDateIndex === assessmentDates.length - 1}
                className={`p-2 rounded ${currentDateIndex === assessmentDates.length - 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setViewMode('field')} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === 'field' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <Grid size={18} /> Field
              </button>
              <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <List size={18} /> Table
              </button>
              <button onClick={() => setViewMode('summary')} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <List size={18} /> Summary
              </button>
              <button onClick={() => setViewMode('analysis')} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <BarChart3 size={18} /> Analysis
              </button>
              <button onClick={() => setViewMode('notes')} className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === 'notes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                <FileText size={18} /> Notes
              </button>
            </div>
          </div>

          {/* Assessment Type Selector */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <label className="block text-sm font-medium mb-2">Assessment Type</label>
            <select value={selectedAssessmentType} onChange={(e) => setSelectedAssessmentType(e.target.value)} className="w-full p-2 border rounded">
              {config.assessmentTypes.map(type => (
                <option key={type.name} value={type.name}>{type.name} (Scale: {type.min}-{type.max})</option>
              ))}
            </select>
          </div>

          {/* Field View Controls */}
          {viewMode === 'field' && (
            <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-2">
              <button
                onMouseDown={() => setShowTreatments(true)}
                onMouseUp={() => setShowTreatments(false)}
                onMouseLeave={() => setShowTreatments(false)}
                onTouchStart={() => setShowTreatments(true)}
                onTouchEnd={() => setShowTreatments(false)}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Eye size={20} className="inline mr-2" /> Hold to Show Treatments
              </button>
              <button onClick={generateTestData} className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <Plus size={20} className="inline mr-2" /> Fill Test Data
              </button>
            </div>
          )}
        </>
      )}
      {/* Field Map View */}
      {viewMode === 'field' && currentDateObj && selectedAssessmentType && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">{currentDateObj.date} - {selectedAssessmentType}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {layout.flatMap(block => block).map((plot, plotIdx) => {
              const plotData = currentDateObj.assessments[selectedAssessmentType][plot.plot];
              const colorClass = getValueColor(plotData.value, selectedAssessmentType, currentDateObj);
              const assessment = config.assessmentTypes.find(a => a.name === selectedAssessmentType);
              const photoKey = `${currentDateObj.date}_${plot.plot}`;
              const plotPhotos = photos[photoKey] || [];
              return (
                <div key={plotIdx} className={`p-2 border-2 rounded ${colorClass} transition-colors`}>
                  <div className="text-xs font-medium mb-1">{plot.plot}</div>
                  {showTreatments && (
                    <div className="text-xs mb-1 font-semibold bg-white/90 px-1 rounded">
                      {plot.treatmentName}
                    </div>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min={assessment?.min}
                    max={assessment?.max}
                    value={plotData.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseFloat(val) >= assessment.min && parseFloat(val) <= assessment.max)) {
                        updateData(currentDateObj.date, selectedAssessmentType, plot.plot, val);
                      }
                    }}
                    className="w-full p-1 text-sm border rounded bg-white mb-1"
                    placeholder={`${assessment?.min}-${assessment?.max}`}
                  />
                  <label className="block">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(plot.plot, currentDateObj.date, e)} className="hidden" />
                    <div className="text-xs text-center bg-blue-100 hover:bg-blue-200 p-1 rounded cursor-pointer">
                      <Camera size={12} className="inline" /> {plotPhotos.length > 0 ? `${plotPhotos.length}` : '+'}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
          
          {/* Color Legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
            {(() => {
              const allValues = Object.values(currentDateObj.assessments[selectedAssessmentType])
                .filter(v => v.entered && v.value !== '')
                .map(v => parseFloat(v.value));
              if (allValues.length === 0) {
                return <div className="text-gray-600">Enter data to see color scale</div>;
              }
              const actualMin = Math.min(...allValues).toFixed(1);
              const actualMax = Math.max(...allValues).toFixed(1);
              const assessment = config.assessmentTypes.find(a => a.name === selectedAssessmentType);
              return (
                <>
                  <div className="font-medium mb-2">
                    Color Scale - Data Range: {actualMin} to {actualMax} (Permitted: {assessment?.min}-{assessment?.max})
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-xs">
                    {['bg-red-300', 'bg-red-200', 'bg-orange-300', 'bg-orange-200', 'bg-yellow-300', 
                      'bg-yellow-200', 'bg-lime-300', 'bg-green-200', 'bg-green-300', 'bg-green-400'].map((color, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-full h-8 ${color} border rounded`}></div>
                        <span className="mt-1">{idx === 0 ? 'Low' : idx === 9 ? 'High' : `${idx * 10}%`}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Table View */}
      {viewMode === 'table' && currentDateObj && selectedAssessmentType && (
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-bold mb-4">{currentDateObj.date} - {selectedAssessmentType}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Plot</th>
                <th className="p-2 text-left">Block</th>
                <th className="p-2 text-left">Treatment</th>
                <th className="p-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {layout.flat().map((plot, idx) => {
                const plotData = currentDateObj.assessments[selectedAssessmentType][plot.plot];
                const assessment = config.assessmentTypes.find(a => a.name === selectedAssessmentType);
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">{plot.plot}</td>
                    <td className="p-2">{plot.block}</td>
                    <td className="p-2">{plot.treatmentName}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        min={assessment?.min}
                        max={assessment?.max}
                        value={plotData.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseFloat(val) >= assessment.min && parseFloat(val) <= assessment.max)) {
                            updateData(currentDateObj.date, selectedAssessmentType, plot.plot, val);
                          }
                        }}
                        className="w-24 p-1 border rounded"
                        placeholder={`${assessment?.min}-${assessment?.max}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Summary Table View */}
      {viewMode === 'summary' && selectedAssessmentType && assessmentDates.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <h3 className="text-lg font-bold mb-4">Summary Table - {selectedAssessmentType}</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="p-3 text-left bg-gray-100 sticky left-0">Treatment</th>
                {assessmentDates.map((dateObj, idx) => (
                  <th key={idx} className="p-3 text-center bg-gray-100 min-w-32">
                    {dateObj.date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.treatments.map((treatment, treatmentIdx) => (
                <tr key={treatmentIdx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium bg-gray-50 sticky left-0">{treatment}</td>
                  {assessmentDates.map((dateObj, dateIdx) => {
                    const treatmentValues = layout.flat()
                      .filter(plot => plot.treatment === treatmentIdx)
                      .map(plot => {
                        const plotData = dateObj.assessments[selectedAssessmentType][plot.plot];
                        return plotData.entered && plotData.value !== '' ? parseFloat(plotData.value) : null;
                      })
                      .filter(v => v !== null);
                    if (treatmentValues.length === 0) {
                      return <td key={dateIdx} className="p-3 text-center text-gray-400">-</td>;
                    }
                    const mean = treatmentValues.reduce((a, b) => a + b, 0) / treatmentValues.length;
                    const variance = treatmentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / treatmentValues.length;
                    const stdError = Math.sqrt(variance / treatmentValues.length);
                    return (
                      <td key={dateIdx} className="p-3 text-center">
                        <div className="font-medium">{mean.toFixed(2)}</div>
                        {treatmentValues.length > 1 && (
                          <div className="text-xs text-gray-500">± {stdError.toFixed(2)}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xs text-gray-600">
            <p>Values shown as: Mean ± Standard Error</p>
          </div>
        </div>
      )}
      {/* Analysis View */}
      {viewMode === 'analysis' && selectedAssessmentType && assessmentDates.length > 0 && (
        <div className="space-y-6">
          {/* Statistics Table for All Dates */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">ANOVA Results - {selectedAssessmentType}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="p-3 text-left bg-gray-100">Treatment</th>
                    {assessmentDates.map((dateObj, idx) => (
                      <th key={idx} className="p-3 text-center bg-gray-100 min-w-40">
                        <div>{dateObj.date}</div>
                        <div className="text-xs font-normal text-gray-600 mt-1">Mean (Group)</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.treatments.map((treatment, treatmentIdx) => (
                    <tr key={treatmentIdx} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium bg-gray-50">{treatment}</td>
                      {assessmentDates.map((dateObj, dateIdx) => {
                        const stats = calculateStats(dateObj, selectedAssessmentType);
                        if (!stats) {
                          return <td key={dateIdx} className="p-3 text-center text-gray-400">-</td>;
                        }
                        const treatmentStats = stats.means.find(m => m.treatment === treatmentIdx);
                        if (!treatmentStats) {
                          return <td key={dateIdx} className="p-3 text-center text-gray-400">-</td>;
                        }
                        return (
                          <td key={dateIdx} className="p-3 text-center">
                            <div className="font-medium">{treatmentStats.mean.toFixed(2)}</div>
                            <div className="text-xs font-bold text-blue-600">({treatmentStats.group})</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* ANOVA Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {assessmentDates.map((dateObj, idx) => {
                  const stats = calculateStats(dateObj, selectedAssessmentType);
                  if (!stats) return null;
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium mb-2">{dateObj.date}</div>
                      <div className="space-y-1 text-xs">
                        <div>F-value: {stats.fValue}</div>
                        <div>LSD (95%): {stats.lsd}</div>
                        <div className={stats.significant ? 'text-green-600 font-medium' : 'text-gray-600'}>
                          {stats.significant ? '✓ Significant (p < 0.05)' : '○ Not Significant'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Combined Box Plot for All Dates */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Box Plots - All Assessment Dates</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-8 items-end min-w-max pb-8">
                {config.treatments.map((treatment, treatmentIdx) => (
                  <div key={treatmentIdx} className="flex flex-col items-center">
                    <div className="text-sm font-medium mb-2">{treatment}</div>
                    <div className="flex gap-2 items-end h-64">
                      {assessmentDates.map((dateObj, dateIdx) => {
                        const stats = calculateStats(dateObj, selectedAssessmentType);
                        if (!stats) return null;
                        const mean = stats.means.find(m => m.treatment === treatmentIdx);
                        if (!mean) return null;
                        const min = Math.min(...mean.values);
                        const max = Math.max(...mean.values);
                        const sorted = [...mean.values].sort((a,b) => a - b);
                        const q1 = sorted[Math.floor(sorted.length * 0.25)];
                        const q3 = sorted[Math.floor(sorted.length * 0.75)];
                        const allStats = assessmentDates
                          .map(d => calculateStats(d, selectedAssessmentType))
                          .filter(s => s !== null);
                        const allValues = allStats.flatMap(s => s.means.flatMap(m => m.values));
                        const globalMin = Math.min(...allValues);
                        const globalMax = Math.max(...allValues);
                        const range = globalMax - globalMin;
                        const scale = (val) => ((val - globalMin) / range) * 200;
                        const colors = [
                          'bg-blue-200 border-blue-400',
                          'bg-purple-200 border-purple-400',
                          'bg-pink-200 border-pink-400',
                          'bg-orange-200 border-orange-400',
                          'bg-teal-200 border-teal-400'
                        ];
                        const colorClass = colors[dateIdx % colors.length];
                        return (
                          <div key={dateIdx} className="flex flex-col items-center">
                            <div className="relative h-48 w-12 bg-gray-100 rounded">
                              <div
                                className={`absolute w-full ${colorClass} border-2`}
                                style={{
                                  bottom: `${scale(q1)}px`,
                                  height: `${scale(q3) - scale(q1)}px`
                                }}
                              />
                              <div
                                className="absolute w-full h-0.5 bg-black"
                                style={{ bottom: `${scale(mean.mean)}px` }}
                              />
                              <div
                                className="absolute left-1/2 w-0.5 bg-black -translate-x-1/2"
                                style={{
                                  bottom: `${scale(q1)}px`,
                                  height: `${scale(min) - scale(q1)}px`
                                }}
                              />
                              <div
                                className="absolute left-1/2 w-0.5 bg-black -translate-x-1/2"
                                style={{
                                  bottom: `${scale(q3)}px`,
                                  height: `${scale(max) - scale(q3)}px`
                                }}
                              />
                            </div>
                            <div className="text-xs mt-2 text-center">{dateObj.date}</div>
                            <div className="text-xs text-gray-600">{mean.group}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              <p>Each treatment shows box plots for all assessment dates side by side</p>
              <p>Different colors represent different assessment dates</p>
            </div>
          </div>
        </div>
      )}
      {/* Notes View */}
      {viewMode === 'notes' && currentDateObj && selectedAssessmentType && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Notes - {currentDateObj.date} - {selectedAssessmentType}</h3>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Assessment Notes</label>
            <textarea
              value={notes[`${currentDateObj.date}_${selectedAssessmentType}`] || ''}
              onChange={(e) => updateNotes(currentDateObj.date, selectedAssessmentType, e.target.value)}
              className="w-full p-3 border rounded min-h-[200px]"
              placeholder="Enter observations, weather conditions, notable findings, or any other relevant information..."
            />
          </div>

          {/* Photo Gallery */}
          <div>
            <h4 className="font-medium mb-3">Photos from this Assessment</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {layout.flat().map(plot => {
                const photoKey = `${currentDateObj.date}_${plot.plot}`;
                const plotPhotos = photos[photoKey] || [];
                return plotPhotos.map((photo, photoIdx) => (
                  <div key={`${plot.plot}-${photoIdx}`} className="relative group">
                    <img src={photo} alt={`${plot.plot}`} className="w-full h-32 object-cover rounded border" />
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {plot.plot}
                    </div>
                    <button
                      onClick={() => deletePhoto(plot.plot, currentDateObj.date, photoIdx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ));
              })}
            </div>
            {Object.keys(photos).filter(key => key.startsWith(currentDateObj.date)).length === 0 && (
              <p className="text-gray-500 text-sm">No photos uploaded yet. Add photos in Field Map view.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialDataTool;
