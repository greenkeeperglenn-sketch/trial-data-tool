import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, BarChart3, Grid, List, Eye, ChevronLeft, ChevronRight, Camera, FileText, X, RotateCw, Lock, Unlock, Navigation, GripVertical } from 'lucide-react';

const TrialDataTool = () => {
  const [step, setStep] = useState('library');
  const [currentTrialId, setCurrentTrialId] = useState(null);
  const [trials, setTrials] = useState({});
  const [config, setConfig] = useState({
    trialName: '',
    numBlocks: 4,
    numTreatments: 3,
    treatments: ['Treatment A', 'Treatment B', 'Treatment C'],
    assessmentTypes: [
      { name: 'Turf Quality', min: 1, max: 10 },
      { name: 'Turf Color', min: 1, max: 10 },
      { name: 'NDVI', min: 0, max: 1 },
      { name: '% Live Ground Cover', min: 0, max: 100 },
      { name: '% Disease Severity', min: 0, max: 100 },
      { name: '% Microdochium Patch', min: 0, max: 100 },
      { name: '% Dollar Spot', min: 0, max: 100 },
      { name: '% Anthracnose', min: 0, max: 100 }
    ]
  });
  const [layout, setLayout] = useState([]);
  const [gridLayout, setGridLayout] = useState([]); // 2D array for visual layout
  const [orientation, setOrientation] = useState(0); // 0=N, 90=E, 180=S, 270=W
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [draggedPlot, setDraggedPlot] = useState(null);
  const [assessmentDates, setAssessmentDates] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [viewMode, setViewMode] = useState('field');
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [showTreatments, setShowTreatments] = useState(false);
  const [photos, setPhotos] = useState({});
  const [notes, setNotes] = useState({});
  const [reverseColorScale, setReverseColorScale] = useState(false);
  const [showInputDropdown, setShowInputDropdown] = useState(false);

  // Load trials from localStorage
  useEffect(() => {
    const savedTrials = localStorage.getItem('trials');
    if (savedTrials) {
      setTrials(JSON.parse(savedTrials));
    }
  }, []);

  // Save trials to localStorage
  useEffect(() => {
    if (Object.keys(trials).length > 0) {
      localStorage.setItem('trials', JSON.stringify(trials));
    }
  }, [trials]);

  const saveCurrentTrial = () => {
    if (!currentTrialId) return;
    const trialData = {
      id: currentTrialId,
      name: config.trialName,
      config,
      layout,
      gridLayout,
      orientation,
      layoutLocked,
      assessmentDates,
      photos,
      notes,
      lastModified: new Date().toISOString(),
      created: trials[currentTrialId]?.created || new Date().toISOString()
    };
    setTrials(prev => ({ ...prev, [currentTrialId]: trialData }));
  };

  useEffect(() => {
    if (currentTrialId && layout.length > 0) {
      saveCurrentTrial();
    }
  }, [config, layout, gridLayout, orientation, layoutLocked, assessmentDates, photos, notes]);

  const createNewTrial = () => {
    const id = Date.now().toString();
    setCurrentTrialId(id);
    setConfig({
      trialName: 'New Trial',
      numBlocks: 4,
      numTreatments: 3,
      treatments: ['Treatment A', 'Treatment B', 'Treatment C'],
      assessmentTypes: [
        { name: 'Turf Quality', min: 1, max: 10 },
        { name: 'Turf Color', min: 1, max: 10 },
        { name: 'NDVI', min: 0, max: 1 },
        { name: '% Live Ground Cover', min: 0, max: 100 },
        { name: '% Disease Severity', min: 0, max: 100 },
        { name: '% Microdochium Patch', min: 0, max: 100 },
        { name: '% Dollar Spot', min: 0, max: 100 },
        { name: '% Anthracnose', min: 0, max: 100 }
      ]
    });
    setLayout([]);
    setGridLayout([]);
    setOrientation(0);
    setLayoutLocked(false);
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
    setGridLayout(trial.gridLayout || []);
    setOrientation(trial.orientation || 0);
    setLayoutLocked(trial.layoutLocked || false);
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

  // Generate initial grid layout
  const generateLayout = () => {
    const grid = [];
    for (let block = 0; block < config.numBlocks; block++) {
      const row = [];
      const treatments = [...Array(config.numTreatments).keys()];
      const shuffled = [...treatments].sort(() => Math.random() - 0.5);
      
      shuffled.forEach(treatmentIdx => {
        row.push({
          block: block + 1,
          treatment: treatmentIdx,
          treatmentName: config.treatments[treatmentIdx],
          plot: `B${block + 1}-T${treatmentIdx + 1}`,
          isBlank: false
        });
      });
      grid.push(row);
    }
    
    setGridLayout(grid);
    
    // Flatten for compatibility
    const flatLayout = grid.flatMap(row => row.filter(p => !p.isBlank));
    setLayout(flatLayout.map(p => [p]));
    
    setStep('layoutBuilder');
  };

  // Insert blank plot
  const insertBlankPlot = (rowIdx, colIdx, direction) => {
    const newGrid = gridLayout.map(row => [...row]);
    const blankPlot = {
      plot: `BLANK-${Date.now()}`,
      treatmentName: 'Blank',
      isBlank: true,
      block: null,
      treatment: null
    };
    
    if (direction === 'horizontal') {
      newGrid[rowIdx].splice(colIdx + 1, 0, blankPlot);
    } else {
      const newRow = Array(newGrid[0].length).fill(null).map(() => ({
        ...blankPlot,
        plot: `BLANK-${Date.now()}-${Math.random()}`
      }));
      newGrid.splice(rowIdx + 1, 0, newRow);
    }
    
    setGridLayout(newGrid);
    updateLayoutFromGrid(newGrid);
  };

  // Drag and drop handlers
  const handleDragStart = (e, rowIdx, colIdx) => {
    if (layoutLocked) return;
    setDraggedPlot({ rowIdx, colIdx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetRowIdx, targetColIdx) => {
    e.preventDefault();
    if (!draggedPlot || layoutLocked) return;
    
    const newGrid = gridLayout.map(row => [...row]);
    const source = newGrid[draggedPlot.rowIdx][draggedPlot.colIdx];
    const target = newGrid[targetRowIdx][targetColIdx];
    
    // Swap plots
    newGrid[draggedPlot.rowIdx][draggedPlot.colIdx] = target;
    newGrid[targetRowIdx][targetColIdx] = source;
    
    setGridLayout(newGrid);
    updateLayoutFromGrid(newGrid);
    setDraggedPlot(null);
  };

  // Update flat layout from grid
  const updateLayoutFromGrid = (grid) => {
    const flatLayout = grid.flatMap(row => row.filter(p => !p.isBlank));
    setLayout(flatLayout.map(p => [p]));
  };

  // Rotate orientation
  const rotateOrientation = () => {
    setOrientation((orientation + 90) % 360);
  };

  // Lock/Unlock layout
  const toggleLayoutLock = () => {
    if (layoutLocked) {
      if (confirm('⚠️ ARE YOU ABSOLUTELY SURE?\n\nUnlocking the layout will allow you to modify plot positions.\nThis may affect existing data if plot IDs change.\n\nProceed with caution!')) {
        setLayoutLocked(false);
      }
    } else {
      setLayoutLocked(true);
      setStep('entry');
    }
  };

  // Finalize and go to data entry
  const finalizeLayout = () => {
    setLayoutLocked(true);
    setStep('entry');
  };

  // Get treatment color for layout display
  const getTreatmentColorClass = (treatmentIdx) => {
    const colors = [
      'bg-blue-100 border-blue-400',
      'bg-green-100 border-green-400',
      'bg-yellow-100 border-yellow-400',
      'bg-purple-100 border-purple-400',
      'bg-pink-100 border-pink-400',
      'bg-orange-100 border-orange-400',
      'bg-teal-100 border-teal-400',
      'bg-indigo-100 border-indigo-400',
      'bg-red-100 border-red-400'
    ];
    return colors[treatmentIdx % colors.length];
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
          .filter(plot => plot.treatment === treatmentIdx && !plot.isBlank)
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

  const addAssessmentDate = () => {
    if (!currentDate) return;
    const newDate = { date: currentDate, assessments: {} };
    config.assessmentTypes.forEach(type => {
      newDate.assessments[type.name] = {};
      gridLayout.flat().forEach(plot => {
        if (!plot.isBlank) {
          newDate.assessments[type.name][plot.plot] = { value: '', entered: false };
        }
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
      if (plot.isBlank) return;
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
    if (range === 0) return 'bg-green-300 border-green-500';
    
    let normalized = Math.max(0, Math.min(1, (numValue - min) / range));
    if (reverseColorScale) normalized = 1 - normalized;
    
    if (normalized < 0.1) return 'bg-white border-gray-300';
    else if (normalized < 0.2) return 'bg-green-50 border-green-200';
    else if (normalized < 0.3) return 'bg-green-100 border-green-300';
    else if (normalized < 0.4) return 'bg-green-200 border-green-400';
    else if (normalized < 0.5) return 'bg-green-300 border-green-500';
    else if (normalized < 0.6) return 'bg-green-400 border-green-600';
    else if (normalized < 0.7) return 'bg-green-500 border-green-700 text-white';
    else if (normalized < 0.8) return 'bg-green-600 border-green-800 text-white';
    else if (normalized < 0.9) return 'bg-green-700 border-green-900 text-white';
    else return 'bg-green-800 border-green-950 text-white';
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
    const lsd = 1.96 * Math.sqrt(2 * msError / config.numBlocks);
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
// Library View
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
            <Upload size={20} /> Import Trial (JSON)
            <input type="file" accept=".json" onChange={importTrialJSON} className="hidden" />
          </label>
        </div>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>💡 Tip:</strong> Use "Backup Trial" to export your trial as JSON. You can re-import it here to restore data or share with colleagues.
          </p>
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
                  {trial.layoutLocked && <div className="text-green-600 font-medium">✓ Layout Locked</div>}
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

  // Setup View
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
  // Layout Builder View
  if (step === 'layoutBuilder') {
    const getOrientationLabel = () => {
      switch(orientation) {
        case 0: return 'North ↑';
        case 90: return 'East →';
        case 180: return 'South ↓';
        case 270: return 'West ←';
        default: return 'North ↑';
      }
    };

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Layout Builder</h1>
            <p className="text-gray-600">Arrange your trial plots</p>
          </div>
          <button onClick={() => setStep('setup')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            ← Back to Setup
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-4 flex-wrap items-center">
          <button 
            onClick={rotateOrientation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Navigation size={20} /> Rotate: {getOrientationLabel()}
          </button>
          
          <button 
            onClick={finalizeLayout}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Lock size={20} /> Finalize & Lock Layout
          </button>

          <div className="text-sm text-gray-600">
            Drag plots to rearrange • Click + to add blanks
          </div>
        </div>

        {/* Compass Indicator */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center">
              <div 
                className="absolute w-full h-full flex items-start justify-center transition-transform duration-300"
                style={{ transform: `rotate(${orientation}deg)` }}
              >
                <div className="text-2xl font-bold text-red-600">N</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                <div className="absolute top-2">N</div>
                <div className="absolute right-2">E</div>
                <div className="absolute bottom-2">S</div>
                <div className="absolute left-2">W</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Plot Layout Grid</h3>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {gridLayout.map((row, rowIdx) => (
                <div key={rowIdx}>
                  {/* Row of plots */}
                  <div className="flex items-center">
                    {row.map((plot, colIdx) => (
                      <div key={colIdx} className="relative">
                        {/* Plot cell */}
                        <div
                          draggable={!layoutLocked}
                          onDragStart={(e) => handleDragStart(e, rowIdx, colIdx)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                          className={`
                            w-24 h-24 m-1 border-2 rounded flex flex-col items-center justify-center
                            ${plot.isBlank ? 'bg-gray-100 border-gray-300 border-dashed' : getTreatmentColorClass(plot.treatment)}
                            ${!layoutLocked ? 'cursor-move hover:shadow-lg' : 'cursor-default'}
                            transition-all
                          `}
                        >
                          {!plot.isBlank && (
                            <>
                              <div className="text-xs font-bold">{plot.plot}</div>
                              <div className="text-xs text-gray-600">{plot.treatmentName}</div>
                              {!layoutLocked && <GripVertical size={12} className="text-gray-400 mt-1" />}
                            </>
                          )}
                          {plot.isBlank && (
                            <div className="text-xs text-gray-400">Blank</div>
                          )}
                        </div>

                        {/* Horizontal + button (right side of plot) */}
                        {!layoutLocked && colIdx < row.length - 1 && (
                          <button
                            onClick={() => insertBlankPlot(rowIdx, colIdx, 'horizontal')}
                            className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-orange-500 text-white rounded-full hover:bg-orange-600 flex items-center justify-center z-10"
                            title="Insert blank plot here"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add column button at end of row */}
                    {!layoutLocked && (
                      <button
                        onClick={() => insertBlankPlot(rowIdx, row.length - 1, 'horizontal')}
                        className="w-6 h-6 ml-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 flex items-center justify-center"
                        title="Add blank column"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Vertical + buttons (below row) */}
                  {!layoutLocked && rowIdx < gridLayout.length - 1 && (
                    <div className="flex items-center ml-1">
                      {row.map((_, colIdx) => (
                        <button
                          key={colIdx}
                          onClick={() => insertBlankPlot(rowIdx, colIdx, 'vertical')}
                          className="w-24 h-6 m-1 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center"
                          title="Insert blank row here"
                        >
                          <Plus size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add row button at bottom */}
              {!layoutLocked && (
                <div className="flex items-center ml-1 mt-2">
                  {gridLayout[0]?.map((_, colIdx) => (
                    <button
                      key={colIdx}
                      onClick={() => insertBlankPlot(gridLayout.length - 1, colIdx, 'vertical')}
                      className="w-24 h-6 m-1 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center"
                      title="Add blank row"
                    >
                      <Plus size={14} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h4 className="font-medium mb-2">Instructions:</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• <strong>Drag & Drop:</strong> Click and drag plots to rearrange</li>
              <li>• <strong>Add Blanks:</strong> Click orange <Plus size={12} className="inline" /> buttons to insert blank plots</li>
              <li>• <strong>Rotate View:</strong> Change orientation to match field layout</li>
              <li>• <strong>Finalize:</strong> Lock layout when ready to start data entry</li>
            </ul>
          </div>

          {/* Treatment Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-3">Treatment Legend:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {config.treatments.map((treatment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-6 h-6 border-2 rounded ${getTreatmentColorClass(idx)}`}></div>
                  <span className="text-sm">{treatment}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-dashed border-gray-300 bg-gray-100 rounded"></div>
                <span className="text-sm">Blank Plot</span>
              </div>
            </div>
          </div>
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
          <p className="text-sm text-gray-600">
            Auto-saved • {layoutLocked ? '🔒 Layout Locked' : '🔓 Layout Unlocked'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            <Download size={16} /> Export Data
          </button>
          <button onClick={exportSummaryCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            <Download size={16} /> Summary
          </button>
          <button onClick={exportTrialJSON} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
            <Download size={16} /> Backup Trial
          </button>
          {!layoutLocked && (
            <button onClick={() => setStep('layoutBuilder')} className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
              <Grid size={16} /> Edit Layout
            </button>
          )}
          {layoutLocked && (
            <button onClick={toggleLayoutLock} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
              <Unlock size={16} /> Unlock Layout
            </button>
          )}
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

          {/* Navigation Structure */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex gap-2 flex-wrap">
              {/* Input Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowInputDropdown(!showInputDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded ${
                    ['field', 'table', 'notes'].includes(viewMode) ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Input ▼
                </button>
                {showInputDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded border z-10">
                    <button 
                      onClick={() => { setViewMode('field'); setShowInputDropdown(false); }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                    >
                      <Grid size={16} className="inline mr-2" /> Field Map
                    </button>
                    <button 
                      onClick={() => { setViewMode('table'); setShowInputDropdown(false); }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                    >
                      <List size={16} className="inline mr-2" /> Table View
                    </button>
                    <button 
                      onClick={() => { setViewMode('notes'); setShowInputDropdown(false); }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                    >
                      <FileText size={16} className="inline mr-2" /> Notes
                    </button>
                  </div>
                )}
              </div>
              
              {/* Analysis Tab */}
              <button 
                onClick={() => setViewMode('analysis')}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  viewMode === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                <BarChart3 size={18} /> Analysis
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
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <div className="flex gap-2 flex-wrap">
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
                <button 
                  onClick={() => setReverseColorScale(!reverseColorScale)}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <RotateCw size={20} /> {reverseColorScale ? 'Dark = High' : 'Dark = Low'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Field Map View */}
      {viewMode === 'field' && currentDateObj && selectedAssessmentType && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">{currentDateObj.date} - {selectedAssessmentType}</h3>
          
          {/* Display grid layout matching builder */}
          <div className="overflow-x-auto mb-4">
            <div className="inline-block min-w-full">
              {gridLayout.map((row, rowIdx) => (
                <div key={rowIdx} className="flex">
                  {row.map((plot, colIdx) => {
                    if (plot.isBlank) {
                      return (
                        <div key={colIdx} className="w-24 h-24 m-1 border-2 border-dashed border-gray-300 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">Blank</span>
                        </div>
                      );
                    }
                    
                    const plotData = currentDateObj.assessments[selectedAssessmentType][plot.plot];
                    const colorClass = getValueColor(plotData?.value, selectedAssessmentType, currentDateObj);
                    const assessment = config.assessmentTypes.find(a => a.name === selectedAssessmentType);
                    const photoKey = `${currentDateObj.date}_${plot.plot}`;
                    const plotPhotos = photos[photoKey] || [];
                    
                    return (
                      <div key={colIdx} className={`w-24 h-auto m-1 p-2 border-2 rounded ${colorClass} transition-colors`}>
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
                          value={plotData?.value || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseFloat(val) >= assessment.min && parseFloat(val) <= assessment.max)) {
                              updateData(currentDateObj.date, selectedAssessmentType, plot.plot, val);
                            }
                          }}
                          className="w-full p-1 text-xs border rounded bg-white mb-1"
                          placeholder={`${assessment?.min}-${assessment?.max}`}
                        />
                        <label className="block">
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(plot.plot, currentDateObj.date, e)} className="hidden" />
                          <div className="text-xs text-center bg-blue-100 hover:bg-blue-200 p-1 rounded cursor-pointer">
                            <Camera size={10} className="inline" /> {plotPhotos.length > 0 ? `${plotPhotos.length}` : '+'}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
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
                    Color Scale - Data Range: {actualMin} to {actualMax} (Scale: {assessment?.min}-{assessment?.max})
                    {reverseColorScale && <span className="ml-2 text-orange-600">⚠️ Reversed</span>}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-white border-2 border-gray-300 rounded"></div>
                      <span className="mt-1">{reverseColorScale ? 'High' : 'Low'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-50 border-2 border-green-200 rounded"></div>
                      <span className="mt-1">10%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-100 border-2 border-green-300 rounded"></div>
                      <span className="mt-1">20%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-200 border-2 border-green-400 rounded"></div>
                      <span className="mt-1">30%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-300 border-2 border-green-500 rounded"></div>
                      <span className="mt-1">40%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-400 border-2 border-green-600 rounded"></div>
                      <span className="mt-1">50%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-500 border-2 border-green-700 rounded"></div>
                      <span className="mt-1">60%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-600 border-2 border-green-800 rounded"></div>
                      <span className="mt-1">70%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-700 border-2 border-green-900 rounded"></div>
                      <span className="mt-1">80%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full h-8 bg-green-800 border-2 border-green-950 rounded"></div>
                      <span className="mt-1">{reverseColorScale ? 'Low' : 'High'}</span>
                    </div>
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
              {gridLayout.flat().filter(p => !p.isBlank).map((plot, idx) => {
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
                        value={plotData?.value || ''}
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
              placeholder="Enter observations, weather conditions, notable findings..."
            />
          </div>

          {/* Mock Voice Recording Button */}
          <div className="mb-6">
            <button 
              onClick={() => alert('Voice transcription coming in Phase 2! For now, please type your notes.')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
              disabled
            >
              🎤 Voice Recording (Coming Soon)
            </button>
          </div>

          {/* Photo Gallery */}
          <div>
            <h4 className="font-medium mb-3">Photos from this Assessment</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {gridLayout.flat().filter(p => !p.isBlank).map(plot => {
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

      {/* MERGED Analysis View */}
      {viewMode === 'analysis' && selectedAssessmentType && assessmentDates.length > 0 && (
        <div className="space-y-6">
          {/* Statistics Table for All Dates */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Statistical Analysis - {selectedAssessmentType}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="p-3 text-left bg-gray-100">Treatment</th>
                    {assessmentDates.map((dateObj, idx) => (
                      <th key={idx} className="p-3 text-center bg-gray-100 min-w-40">
                        <div>{dateObj.date}</div>
                        <div className="text-xs font-normal text-gray-600 mt-1">Mean ± SE (Group)</div>
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
                        const variance = treatmentStats.values.reduce((sum, val) => 
                          sum + Math.pow(val - treatmentStats.mean, 2), 0) / treatmentStats.values.length;
                        const stdError = Math.sqrt(variance / treatmentStats.values.length);
                        return (
                          <td key={dateIdx} className="p-3 text-center">
                            <div className="font-medium">{treatmentStats.mean.toFixed(2)} ± {stdError.toFixed(2)}</div>
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
                        <div>MS Error: {stats.msError}</div>
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
    </div>
  );
};

export default TrialDataTool;
  



    
  };
