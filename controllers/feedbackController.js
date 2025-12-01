const { run, get, all } = require('../config/database');

// Get all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    
    const feedback = await all(
      `SELECT * FROM feedback ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    
    const countResult = await get('SELECT COUNT(*) as total FROM feedback');
    const total = countResult.total;
    
    res.json({
      success: true,
      data: feedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await get(
      'SELECT * FROM feedback WHERE id = ?',
      [req.params.id]
    );
    
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get feedback by project type
exports.getFeedbackByProject = async (req, res) => {
  try {
    const { projectType } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const feedback = await all(
      'SELECT * FROM feedback WHERE project_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [projectType, parseInt(limit), offset]
    );
    
    const countResult = await get(
      'SELECT COUNT(*) as total FROM feedback WHERE project_type = ?',
      [projectType]
    );
    const total = countResult.total;
    
    res.json({
      success: true,
      data: feedback,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { projectType, rating, innovation, comments } = req.body;
    
    // Validation
    if (!projectType || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project type and rating are required' 
      });
    }
    
    const result = await run(
      'INSERT INTO feedback (project_type, rating, innovation, comments) VALUES (?, ?, ?, ?)',
      [projectType, rating, innovation || null, comments || null]
    );
    
    const newFeedback = await get(
      'SELECT * FROM feedback WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
  try {
    const { projectType, rating, innovation, comments } = req.body;
    const { id } = req.params;
    
    // Check if feedback exists
    const existing = await get('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    
    await run(
      'UPDATE feedback SET project_type = COALESCE(?, project_type), rating = COALESCE(?, rating), innovation = COALESCE(?, innovation), comments = COALESCE(?, comments), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [projectType, rating, innovation, comments, id]
    );
    
    const updatedFeedback = await get('SELECT * FROM feedback WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }
    
    await run('DELETE FROM feedback WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Feedback deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
  try {
    // Project stats
    const projectStats = await all(`
      SELECT 
        project_type,
        COUNT(*) as total_feedback,
        AVG(rating) as average_rating,
        MAX(rating) as highest_rating,
        MIN(rating) as lowest_rating
      FROM feedback 
      GROUP BY project_type
    `);
    
    // Total feedback count
    const countResult = await get('SELECT COUNT(*) as totalFeedback FROM feedback');
    const totalFeedback = countResult.totalFeedback;
    
    // Overall average rating
    const avgResult = await get('SELECT AVG(rating) as overallAvgRating FROM feedback');
    const overallAvgRating = avgResult.overallAvgRating;
    
    // Innovation distribution
    const innovationStats = await all(`
      SELECT innovation as _id, COUNT(*) as count 
      FROM feedback 
      WHERE innovation IS NOT NULL 
      GROUP BY innovation
    `);
    
    res.json({
      success: true,
      data: {
        totalFeedback,
        overallAverageRating: overallAvgRating ? parseFloat(overallAvgRating).toFixed(2) : 0,
        projectStats: projectStats.map(s => ({
          projectType: s.project_type,
          totalFeedback: s.total_feedback,
          averageRating: s.average_rating ? parseFloat(s.average_rating).toFixed(2) : 0,
          highestRating: s.highest_rating,
          lowestRating: s.lowest_rating
        })),
        innovationDistribution: innovationStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
