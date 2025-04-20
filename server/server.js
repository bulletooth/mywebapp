// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const basicAuth = require('express-basic-auth');
const users = {};
users[process.env.AUTH_USERNAME] = process.env.AUTH_PASSWORD;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api', basicAuth({
    users: users,
    challenge: true,
    realm: 'PCN Appeal API'
}));

// API proxy endpoint for Anthropic
app.post('/api/generate-advice', async (req, res) => {
  try {
    console.log('Received request for PCN advice');
    
    // Get form data from request body
    const { pcnType, pcnReason, pcnIssueDate, incidentDate, stepsTaken, explanation } = req.body;
    
    // Validate required fields
    if (!pcnType || !pcnReason || !pcnIssueDate || !incidentDate || !explanation) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please provide all required PCN information'
      });
    }
    
    console.log(`Processing PCN advice request - Type: ${pcnType}, Reason: ${pcnReason}`);
    
    // Create prompt for Anthropic API
    const prompt = `
Please review the following Penalty Charge Notice (PCN) appeal information:

PCN Type: ${pcnType}
Reason for PCN: ${pcnReason}
Date PCN Issued: ${pcnIssueDate}
Date of Incident: ${incidentDate}
Steps Already Taken: ${stepsTaken || 'None specified'}

Explanation:
${explanation}

Based on this information, please provide:
1. An assessment of the appeal's potential strength
2. Specific points that should be emphasized in the appeal
3. Additional evidence that might help the case
4. Recommended next steps
5. A draft appeal letter that could be used as a template
`;

    console.log('Calling Anthropic API...');
    
    // Call Anthropic API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    console.log('Received response from Anthropic API');
    
    // Return the advice to the client
    res.json({ 
      success: true,
      advice: response.data.content[0].text 
    });
    
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The API responded with an error status
      return res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data.error?.message || 'Error from Anthropic API',
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'No response received from Anthropic API'
      });
    } else {
      // Something happened in setting up the request
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`API endpoint available at: http://localhost:${PORT}/api/generate-advice`);
});