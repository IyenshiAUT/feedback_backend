// Cloudflare Worker entry point for D1 database
export default {
  async fetch(request, env, ctx) {
    // Set D1 database globally for the database module
    globalThis.DB = env.DB;
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Initialize database tables on first request
      await initializeDatabase(env.DB);
      
      // Route handling
      if (path === '/' || path === '') {
        return jsonResponse({
          message: 'Welcome to Team MIMH Feedback API',
          endpoints: {
            health: '/api/health',
            feedback: {
              getAll: 'GET /api/feedback',
              getOne: 'GET /api/feedback/:id',
              create: 'POST /api/feedback',
              update: 'PUT /api/feedback/:id',
              delete: 'DELETE /api/feedback/:id',
              getByProject: 'GET /api/feedback/project/:projectType',
              getStats: 'GET /api/feedback/stats/summary'
            }
          }
        }, corsHeaders);
      }
      
      if (path === '/api/health') {
        return jsonResponse({ status: 'OK', message: 'Team MIMH Feedback API is running' }, corsHeaders);
      }
      
      // Feedback routes
      if (path === '/api/feedback' && request.method === 'GET') {
        return await getAllFeedback(env.DB, url, corsHeaders);
      }
      
      if (path === '/api/feedback' && request.method === 'POST') {
        return await createFeedback(env.DB, request, corsHeaders);
      }
      
      if (path === '/api/feedback/stats/summary' && request.method === 'GET') {
        return await getFeedbackStats(env.DB, corsHeaders);
      }
      
      // Match /api/feedback/project/:projectType
      const projectMatch = path.match(/^\/api\/feedback\/project\/(.+)$/);
      if (projectMatch && request.method === 'GET') {
        return await getFeedbackByProject(env.DB, projectMatch[1], url, corsHeaders);
      }
      
      // Match /api/feedback/:id
      const idMatch = path.match(/^\/api\/feedback\/(\d+)$/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        if (request.method === 'GET') {
          return await getFeedbackById(env.DB, id, corsHeaders);
        }
        if (request.method === 'PUT') {
          return await updateFeedback(env.DB, id, request, corsHeaders);
        }
        if (request.method === 'DELETE') {
          return await deleteFeedback(env.DB, id, corsHeaders);
        }
      }
      
      return jsonResponse({ error: 'Not Found' }, corsHeaders, 404);
      
    } catch (error) {
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  }
};

// Helper function for JSON responses
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Initialize database tables
async function initializeDatabase(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_type TEXT NOT NULL CHECK (project_type IN ('tourist-utility-service-system', 'stroke-hand-recovery-system')),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      innovation TEXT CHECK (innovation IN ('low', 'medium', 'high', 'breakthrough') OR innovation IS NULL),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

// Get all feedback
async function getAllFeedback(db, url, corsHeaders) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const order = url.searchParams.get('order') || 'desc';
  const offset = (page - 1) * limit;
  
  const feedback = await db.prepare(
    `SELECT * FROM feedback ORDER BY ${sortBy} ${order.toUpperCase()} LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();
  
  const countResult = await db.prepare('SELECT COUNT(*) as total FROM feedback').first();
  
  return jsonResponse({
    success: true,
    data: feedback.results,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(countResult.total / limit),
      totalItems: countResult.total,
      itemsPerPage: limit
    }
  }, corsHeaders);
}

// Get feedback by ID
async function getFeedbackById(db, id, corsHeaders) {
  const feedback = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
  
  if (!feedback) {
    return jsonResponse({ success: false, error: 'Feedback not found' }, corsHeaders, 404);
  }
  
  return jsonResponse({ success: true, data: feedback }, corsHeaders);
}

// Get feedback by project type
async function getFeedbackByProject(db, projectType, url, corsHeaders) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  const feedback = await db.prepare(
    'SELECT * FROM feedback WHERE project_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(projectType, limit, offset).all();
  
  const countResult = await db.prepare(
    'SELECT COUNT(*) as total FROM feedback WHERE project_type = ?'
  ).bind(projectType).first();
  
  return jsonResponse({
    success: true,
    data: feedback.results,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(countResult.total / limit),
      totalItems: countResult.total,
      itemsPerPage: limit
    }
  }, corsHeaders);
}

// Create new feedback
async function createFeedback(db, request, corsHeaders) {
  const body = await request.json();
  const { projectType, rating, innovation, comments } = body;
  
  if (!projectType || !rating) {
    return jsonResponse({ 
      success: false, 
      error: 'Project type and rating are required' 
    }, corsHeaders, 400);
  }
  
  const result = await db.prepare(
    'INSERT INTO feedback (project_type, rating, innovation, comments) VALUES (?, ?, ?, ?)'
  ).bind(projectType, rating, innovation || null, comments || null).run();
  
  const newFeedback = await db.prepare(
    'SELECT * FROM feedback WHERE id = ?'
  ).bind(result.meta.last_row_id).first();
  
  return jsonResponse({ 
    success: true, 
    message: 'Feedback submitted successfully',
    data: newFeedback
  }, corsHeaders, 201);
}

// Update feedback
async function updateFeedback(db, id, request, corsHeaders) {
  const existing = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
  
  if (!existing) {
    return jsonResponse({ success: false, error: 'Feedback not found' }, corsHeaders, 404);
  }
  
  const body = await request.json();
  const { projectType, rating, innovation, comments } = body;
  
  await db.prepare(
    'UPDATE feedback SET project_type = COALESCE(?, project_type), rating = COALESCE(?, rating), innovation = COALESCE(?, innovation), comments = COALESCE(?, comments), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(projectType, rating, innovation, comments, id).run();
  
  const updatedFeedback = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
  
  return jsonResponse({ 
    success: true, 
    message: 'Feedback updated successfully',
    data: updatedFeedback
  }, corsHeaders);
}

// Delete feedback
async function deleteFeedback(db, id, corsHeaders) {
  const existing = await db.prepare('SELECT * FROM feedback WHERE id = ?').bind(id).first();
  
  if (!existing) {
    return jsonResponse({ success: false, error: 'Feedback not found' }, corsHeaders, 404);
  }
  
  await db.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
  
  return jsonResponse({ 
    success: true, 
    message: 'Feedback deleted successfully' 
  }, corsHeaders);
}

// Get feedback statistics
async function getFeedbackStats(db, corsHeaders) {
  const projectStats = await db.prepare(`
    SELECT 
      project_type,
      COUNT(*) as total_feedback,
      AVG(rating) as average_rating,
      MAX(rating) as highest_rating,
      MIN(rating) as lowest_rating
    FROM feedback 
    GROUP BY project_type
  `).all();
  
  const countResult = await db.prepare('SELECT COUNT(*) as totalFeedback FROM feedback').first();
  const avgResult = await db.prepare('SELECT AVG(rating) as overallAvgRating FROM feedback').first();
  
  const innovationStats = await db.prepare(`
    SELECT innovation as _id, COUNT(*) as count 
    FROM feedback 
    WHERE innovation IS NOT NULL 
    GROUP BY innovation
  `).all();
  
  return jsonResponse({
    success: true,
    data: {
      totalFeedback: countResult.totalFeedback,
      overallAverageRating: avgResult.overallAvgRating ? parseFloat(avgResult.overallAvgRating).toFixed(2) : 0,
      projectStats: projectStats.results.map(s => ({
        projectType: s.project_type,
        totalFeedback: s.total_feedback,
        averageRating: s.average_rating ? parseFloat(s.average_rating).toFixed(2) : 0,
        highestRating: s.highest_rating,
        lowestRating: s.lowest_rating
      })),
      innovationDistribution: innovationStats.results
    }
  }, corsHeaders);
}
