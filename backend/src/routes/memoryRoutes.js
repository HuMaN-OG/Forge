const express = require('express');
const router = express.Router();

// In-memory / persistent experience memory patterns
let memoryRecords = [
  {
    id: 'mem-01',
    patternName: 'Financial Workbook Generator Pattern',
    category: 'Excel Automation',
    triggerPhrases: ['create excel', 'financial summary', 'sales spreadsheet', 'generate kpi table'],
    useCount: 14,
    successRate: '98.5%',
    createdDate: '2026-10-12',
    lastUsed: '2 hours ago',
    description: 'Deterministic structure for financial spreadsheets: Header styling, numeric alignment, auto-column width, formula injections (SUM, AVERAGE, MARGIN).',
    parameters: ['Sheet Names', 'Column Headers', 'Formula Rules', 'Styling Scheme'],
    storedWorkflows: [
      'Initialize openpyxl workbook with Roboto font',
      'Apply primary brand header fill (#0EA5E9)',
      'Inject formulas in capital format (=SUM(C2:C15))',
      'Validate cell references and calculate bounding dimensions'
    ],
    feedback: 'Highly rated by user for accurate formula syntax and no truncated columns.'
  },
  {
    id: 'mem-02',
    patternName: 'Safe Batch File Categorization',
    category: 'File System Operations',
    triggerPhrases: ['organize downloads', 'sort files by type', 'clean folder', 'archive directory'],
    useCount: 8,
    successRate: '100%',
    createdDate: '2026-10-18',
    lastUsed: 'Yesterday',
    description: 'Pre-flight safety workflow: Never overwrite existing files. Check target collisions, generate dry-run manifest, obtain approval, then perform copy-verify-delete.',
    parameters: ['Source Directory', 'Destination Root', 'Date Mask', 'Collision Policy'],
    storedWorkflows: [
      'Scan directory recursively ignoring hidden .git and temp files',
      'Calculate SHA-256 hash before and after movement',
      'Prompt user with interactive diff before disk mutation',
      'Generate post-run json receipt'
    ],
    feedback: 'User noted safety against accidental file overwrites.'
  },
  {
    id: 'mem-03',
    patternName: 'Restricted Workspace Path Resolver',
    category: 'Security & Sandboxing',
    triggerPhrases: ['sandbox path', 'verify directory', 'containment check'],
    useCount: 22,
    successRate: '100%',
    createdDate: '2026-10-24',
    lastUsed: 'Just now',
    description: 'Rigorous canonical path checking to prevent path traversal (../) or symbolic link escapes outside workspace_sandbox.',
    parameters: ['Workspace Root', 'Target Relative Path', 'Resolve Symlinks'],
    storedWorkflows: [
      'Resolve real canonical paths using os.path.realpath',
      'Assert target path is child of workspace root',
      'Reject root directory mutations or escapes'
    ],
    feedback: 'Strict security sandbox validated with 0 escapes.'
  }
];

// GET /api/memory - List and search experience records
router.get('/', (req, res) => {
  try {
    const { q = '', category = 'all' } = req.query;
    let results = [...memoryRecords];

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      results = results.filter(r => r.category.toLowerCase().includes(catLower));
    }

    if (q) {
      const searchLower = q.toLowerCase();
      results = results.filter(r =>
        r.patternName.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        (r.triggerPhrases && r.triggerPhrases.some(phrase => phrase.toLowerCase().includes(searchLower)))
      );
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memory/:id - Delete an experience record
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLen = memoryRecords.length;
    memoryRecords = memoryRecords.filter(r => r.id !== id);

    if (memoryRecords.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    return res.json({
      success: true,
      message: `Experience record ${id} removed successfully.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
