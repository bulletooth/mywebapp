// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'AUTH_USERNAME', 'AUTH_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please add them to your .env file');
    process.exit(1); // Exit with error
  }

// Domain restriction middleware
const domainRestriction = (req, res, next) => {
    const referer = req.headers.referer;
    const origin = req.headers.origin;
    
    console.log('Request referer:', referer);
    console.log('Request origin:', origin);
    
    const allowedDomains = [
      'http://localhost', 
      'https://localhost',
      'http://pcn.mywrights.uk', 
      'https://pcn.mywrights.uk'
    ];
    
    const isAllowed = allowedDomains.some(domain => {
      return (referer && referer.startsWith(domain)) || 
             (origin && origin.startsWith(domain));
    });
    
    if (!isAllowed) {
      console.warn('Access denied: Invalid origin/referer');
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: Invalid origin'
      });
    }
    
    next();
  };

const corsOptions = {
origin: ['http://localhost:3000', 'https://pcn.mywrights.uk'],
methods: ['GET', 'POST'],
allowedHeaders: ['Content-Type', 'Authorization']
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions)); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API proxy endpoint for Anthropic
app.post('/api/generate-advice', domainRestriction, async (req, res) => {
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
Please review this PCN appeal information:

PCN Type: ${pcnType}
Reason: ${pcnReason}
Issued: ${pcnIssueDate}
Incident: ${incidentDate}
Steps: ${stepsTaken || 'None specified'}

Explanation:
${explanation}

First, provide a JSON object with this structure:
{
  "rating": [number between 1-100],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "initial_assessment": "brief 2-3 sentence summary"
}

Then provide a line with exactly "---" as a separator.

Now provide:
  1. Detailed next steps the appellant should take
  2. Any additional evidence they should try to gather
  3. Timeline considerations and deadlines they should be aware of
`;

    console.log('Calling Anthropic API...');
    
    // Call Anthropic API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        temperature: 0.1,
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
        message: (error.response.data.error && error.response.data.error.message) || 'Error from Anthropic API',
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

// API endpoint for detailed PCN appeal advice
app.post('/api/generate-detailed-advice',domainRestriction, async (req, res) => {
    try {
      console.log('Received request for detailed PCN advice');
      
      // Get form data and initial assessment from request body
      const { 
        pcnType, pcnReason, pcnIssueDate, incidentDate, 
        stepsTaken, explanation, initialAssessment, additionalInfo 
      } = req.body;
      
      // Validate required fields
      if (!pcnType || !pcnReason || !pcnIssueDate || !incidentDate || !explanation || !initialAssessment) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Please provide all required PCN information and initial assessment'
        });
      }
      
      console.log(`Processing detailed PCN advice request - Type: ${pcnType}, Reason: ${pcnReason}`);
      console.log(`Additional information provided: ${additionalInfo ? 'Yes' : 'No'}`);
      
      // Create prompt
      let prompt = `
You previously provided an initial assessment for this PCN appeal:

${initialAssessment}

Based on the PCN details:
- Type: ${pcnType}
- Reason: ${pcnReason}
- Issued: ${pcnIssueDate}
- Incident date: ${incidentDate}
- Steps taken: ${stepsTaken || 'None specified'}
- Explanation: ${explanation}
`;

      // Add additional information to the prompt if provided
      if (additionalInfo && additionalInfo.trim()) {
        prompt += `
The user has provided additional information to support their appeal:

${additionalInfo}
`;
      }
      
      prompt += `
Now provide:
1. An evaluation of how this additional information affects their case (if applicable)
2. Detailed next steps the appellant should take
3. A comprehensive draft appeal letter they can use as a template, incorporating all relevant information
`;
  
      console.log('Calling Anthropic API for detailed advice...');
      
      // Call Anthropic API
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          "temperature": 0.1,
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
  
      console.log('Received detailed advice from Anthropic API');
      
      // Return the detailed advice to the client
      res.json({ 
        success: true,
        detailedAdvice: response.data.content[0].text 
      });
      
    } catch (error) {
      console.error('Error calling Anthropic API for detailed advice:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The API responded with an error status
        return res.status(error.response.status).json({
          error: 'API Error',
          message: (error.response.data.error && error.response.data.error.message) || 'Error from Anthropic API',
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
  console.log(`API endpoint available at: http://localhost:${PORT}/api/generate-detailed-advice`);
});