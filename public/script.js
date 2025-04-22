document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const pcnForm = document.getElementById('pcnForm');
    const formProgress = document.getElementById('formProgress');
    
    // Form steps
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Form validation elements
    const pcnType = document.getElementById('pcnType');
    const pcnReasonRadios = document.getElementsByName('pcnReason');
    const pcnIssueDate = document.getElementById('pcnIssueDate');
    const incidentDate = document.getElementById('incidentDate');
    const stepsTaken = document.getElementById('stepsTaken');
    const explanation = document.getElementById('explanation');
    
    // Error message elements
    const pcnTypeError = document.getElementById('pcnTypeError');
    const pcnReasonError = document.getElementById('pcnReasonError');
    const pcnIssueDateError = document.getElementById('pcnIssueDateError');
    const incidentDateError = document.getElementById('incidentDateError');
    const stepsTakenError = document.getElementById('stepsTakenError');
    const explanationError = document.getElementById('explanationError');
    
    // Navigation buttons
    const toStep1Btn = document.getElementById('toStep1');
    const toStep2Btn = document.getElementById('toStep2');
    const fromStep3toStep2Btn = document.getElementById('fromStep3toStep2')
    const toStep3Btn = document.getElementById('toStep3');
    const submitBtn = document.getElementById('submitBtn');
    
    // Results section
    const appealFormSection = document.getElementById('appeal-form-section');
    const resultsSection = document.getElementById('results-section');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('results');
    const adviceContainer = document.getElementById('advice-container');
    const apiError = document.getElementById('api-error');
    
    // Action buttons
    const copyBtn = document.getElementById('copyBtn');
    const startOverBtn = document.getElementById('startOverBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    // Accessibility controls
    const increaseFontBtn = document.getElementById('increaseFontBtn');
    const decreaseFontBtn = document.getElementById('decreaseFontBtn');
    const toggleContrastBtn = document.getElementById('toggleContrastBtn');
    
    // Form fields real-time validation
    pcnType.addEventListener('change', function() {
        if (pcnType.value !== '') {
            pcnTypeError.textContent = '';
        }
    });
    
    for (let i = 0; i < pcnReasonRadios.length; i++) {
        pcnReasonRadios[i].addEventListener('change', function() {
            pcnReasonError.textContent = '';
        });
    }
    
    pcnIssueDate.addEventListener('change', function() {
        pcnIssueDateError.textContent = '';
        
        // Check if incident date is after issue date
        if (incidentDate.value !== '' && incidentDate.value > pcnIssueDate.value) {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
        } else {
            incidentDateError.textContent = '';
        }
    });
    
    explanation.addEventListener('input', function() {
        if (explanation.value.trim().length >= 30) {
            explanationError.textContent = '';
        }
    });
    
    // Keypress event listeners for accessibility
    pcnForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Determine the current step and proceed accordingly
            if (step1.classList.contains('active')) {
                toStep2Btn.click();
            } else if (step2.classList.contains('active')) {
                toStep3Btn.click();
            } else if (step3.classList.contains('active')) {
                submitBtn.click();
            }
        }
    });
    
    // Action buttons
    copyBtn.addEventListener('click', function() {
        const textToCopy = adviceContainer.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Could not copy text. Please try selecting and copying manually.');
            });
    });
    
    startOverBtn.addEventListener('click', function() {
        // Reset form
        pcnForm.reset();
        
        // Clear all advice containers
        adviceContainer.innerHTML = '';
        
        // Reset global variables
        savedAdvice = '';
        savedAssessment = null;
        originalApiResponse = '';
        
        // Hide all results-related elements
        resultsSection.classList.add('hidden');
        resultsSection.style.display = 'none';
        
        resultsContainer.classList.add('hidden');
        resultsContainer.style.display = 'none';
        
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none';
        
        apiError.classList.add('hidden');
        
        // Clear any updated advice containers
        const updatedAdviceContainer = document.getElementById('updated-advice-container');
        if (updatedAdviceContainer) {
            updatedAdviceContainer.classList.add('hidden');
            updatedAdviceContainer.style.display = 'none';
            
            const updatedAdviceContent = document.getElementById('updated-advice-content');
            if (updatedAdviceContent) {
                updatedAdviceContent.innerHTML = '';
            }
        }
        
        // Show form section
        appealFormSection.classList.remove('hidden');
        appealFormSection.style.display = 'block';
        
        // Reset to first step
        showStep(1);
        
        // Scroll to the form
        appealFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    retryBtn.addEventListener('click', async function() {
        // Hide error, show loading
        apiError.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        
        // Collect form data again
        const formData = {
            pcnType: pcnType.value,
            pcnReason: getSelectedRadioValue(pcnReasonRadios),
            pcnIssueDate: pcnIssueDate.value,
            incidentDate: incidentDate.value,
            stepsTaken: stepsTaken.value,
            explanation: explanation.value
        };
        
        try {
            // Retry API call
            const response = await callAnthropicAPI(formData);
            showResults(response);
        } catch (error) {
            console.error('API retry error:', error);
            showApiError();
        }
    });
    
    // Accessibility control handlers
    let currentFontSize = parseInt(getComputedStyle(document.documentElement).fontSize);
    
    increaseFontBtn.addEventListener('click', function() {
        if (currentFontSize < 22) { // Maximum font size
            currentFontSize += 2;
            document.documentElement.style.fontSize = currentFontSize + 'px';
            localStorage.setItem('pcnAppFontSize', currentFontSize);
        }
    });
    
    decreaseFontBtn.addEventListener('click', function() {
        if (currentFontSize > 14) { // Minimum font size
            currentFontSize -= 2;
            document.documentElement.style.fontSize = currentFontSize + 'px';
            localStorage.setItem('pcnAppFontSize', currentFontSize);
        }
    });
    
    toggleContrastBtn.addEventListener('click', function() {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        localStorage.setItem('pcnAppHighContrast', isHighContrast);
    });
    
    // Load saved accessibility preferences
    function loadAccessibilityPreferences() {
        const savedFontSize = localStorage.getItem('pcnAppFontSize');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
            document.documentElement.style.fontSize = currentFontSize + 'px';
        }
        
        const savedHighContrast = localStorage.getItem('pcnAppHighContrast');
        if (savedHighContrast === 'true') {
            document.body.classList.add('high-contrast');
        }
    }
    
    loadAccessibilityPreferences();
    
    // Form navigation handlers  
    toStep1Btn.addEventListener('click', function() {
        showStep(1);
    });

    toStep2Btn.addEventListener('click', function() {
        if (validateStep1()) {
            showStep(2);
        }
    });
    
    fromStep3toStep2Btn.addEventListener('click', function() {
        showStep(2);
    });

    toStep3Btn.addEventListener('click', function() {
        if (validateStep2()) {
            showStep(3);
        }
    });
    
    // Show the specified step
    function showStep(stepNum) {
        // Hide all steps
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        
        // Show the requested step
        if (stepNum === 1) {
            step1.classList.add('active');
            formProgress.style.width = '33.33%';
        } else if (stepNum === 2) {
            step2.classList.add('active');
            formProgress.style.width = '66.66%';
        } else if (stepNum === 3) {
            step3.classList.add('active');
            formProgress.style.width = '100%';
        }
        
        // Scroll to form top
        appealFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Validate first step
    function validateStep1() {
        let isValid = true;
        
        // Clear previous errors
        pcnTypeError.textContent = '';
        pcnReasonError.textContent = '';
        
        // Validate PCN type
        if (pcnType.value === '') {
            pcnTypeError.textContent = 'Please select your PCN type';
            isValid = false;
            pcnType.focus();
        }
        
        // Validate PCN reason
        let reasonSelected = false;
        for (let i = 0; i < pcnReasonRadios.length; i++) {
            if (pcnReasonRadios[i].checked) {
                reasonSelected = true;
                break;
            }
        }
        
        if (!reasonSelected) {
            pcnReasonError.textContent = 'Please select the reason PCN was issued';
            isValid = false;
        }
        
        return isValid;
    }
    
    // Validate second step
    function validateStep2() {
        let isValid = true;
        
        // Clear previous errors
        pcnIssueDateError.textContent = '';
        incidentDateError.textContent = '';
        stepsTakenError.textContent = '';
        
        // Validate PCN issue date
        if (pcnIssueDate.value === '') {
            pcnIssueDateError.textContent = 'Please enter the date the PCN was issued';
            isValid = false;
            pcnIssueDate.focus();
        }
        
        // Validate incident date
        if (incidentDate.value === '') {
            incidentDateError.textContent = 'Please enter the date of the incident';
            isValid = false;
            incidentDate.focus();
        } else if (incidentDate.value > pcnIssueDate.value && pcnIssueDate.value !== '') {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
            isValid = false;
            incidentDate.focus();
        }
        
        return isValid;
    }
    
    // Validate third step
    function validateStep3() {
        let isValid = true;
        
        // Clear previous errors
        explanationError.textContent = '';
        
        // Validate explanation
        if (explanation.value.trim() === '') {
            explanationError.textContent = 'Please provide an explanation for your appeal';
            isValid = false;
            explanation.focus();
        } else if (explanation.value.trim().length < 30) {
            explanationError.textContent = 'Please provide a more detailed explanation (at least 30 characters)';
            isValid = false;
            explanation.focus();
        }
        
        return isValid;
    }

    // Function to process API response and separate the JSON assessment from detailed advice
    function processApiResponse(responseText) {
        const separatorIndex = responseText.indexOf('---');
        
        if (separatorIndex === -1) {
            // No separator found, return the whole response as advice
            return {
                assessment: null,
                detailedAdvice: responseText
            };
        }
        
        const jsonPart = responseText.substring(0, separatorIndex).trim();
        const advicePart = responseText.substring(separatorIndex + 3).trim();
        
        try {
            // Look for the JSON object in the response text
            // Match anything between curly braces including the braces
            const jsonRegex = /(\{[\s\S]*\})/;
            const match = jsonPart.match(jsonRegex);
            
            if (match && match[1]) {
                const jsonString = match[1];
                const assessment = JSON.parse(jsonString);
                // Save the assessment globally
                savedAssessment = assessment;
                return {
                    assessment: assessment,
                    detailedAdvice: advicePart
                };
            } else {
                console.error('No JSON object found in the response');
                return {
                    assessment: null,
                    detailedAdvice: responseText
                };
            }
        } catch (error) {
            console.error('Error parsing assessment JSON:', error);
            return {
                assessment: null,
                detailedAdvice: responseText
            };
        }
    }

    // Function to create rating visualisation
    function createRatingVisualization(rating) {
        // Determine colour based on rating
        let color;
        if (rating < 30) {
            color = '#e74c3c'; // Red
        } else if (rating < 70) {
            color = '#f39c12'; // Orange/Yellow
        } else {
            color = '#2ecc71'; // Green
        }
        
        return `
            <div class="rating-container">
                <div class="rating-header">
                    <h3>Appeal Success Rating</h3>
                    <div class="rating-value" style="background-color: ${color}" aria-label="Appeal success rating is ${rating} out of a 100">
                        ${rating}<span class="rating-max">/100</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to create strength/weakness lists
    function createAssessmentLists(strengths, weaknesses) {
    const strengthsHTML = strengths.map(s => `<li class="strength"><i class="fas fa-check-circle"></i> ${s}</li>`).join('');
    const weaknessesHTML = weaknesses.map(w => `<li class="weakness"><i class="fas fa-exclamation-circle"></i> ${w}</li>`).join('');
    
    return `
        <div class="assessment-lists">
            <div class="strengths-list">
                <h4>Strengths</h4>
                <ul>${strengthsHTML}</ul>
            </div>
            <div class="weaknesses-list">
                <h4>Weaknesses</h4>
                <ul>${weaknessesHTML}</ul>
            </div>
        </div>
    `;
    }

    // Function to create the initial assessment
    function createInitialAssessment(assessment) {
        return `
            <div class="initial-assessment">
                <h3>Initial Assessment</h3>
                <p>${assessment.initial_assessment}</p>
            </div>
        `;
    }

    // Function to create "Continue" button
    function createContinueButton() {
        return `
            <div class="continue-container">
                <button id="continueBtn" class="btn continue-btn" aria-label="Continue to Full Appeal Advice">
                    Continue to Full Appeal Advice <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }

    // Save the original form data globally
    let savedFormData = {};
    let savedAssessment = null;

    // Show results
    function showResults(response) {
        // Hide loading indicator (both class and style)
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none';
        
        // Show the results container (both class and style)
        resultsContainer.classList.remove('hidden');
        resultsContainer.style.display = 'block';
        
        // Process and display the advice
        const processedResponse = processApiResponse(response);
        
        if (processedResponse.assessment) {
            // Create assessment view
            const ratingHTML = createRatingVisualization(processedResponse.assessment.rating);
            const initialAssessmentHTML = createInitialAssessment(processedResponse.assessment);
            const listsHTML = createAssessmentLists(
                processedResponse.assessment.strengths, 
                processedResponse.assessment.weaknesses
            );
            const continueButtonHTML = createContinueButton();
            
            // Store the detailed advice for later
            savedAdvice = processedResponse.detailedAdvice || 'No detailed advice available.';
            
            // Update the advice container
            adviceContainer.innerHTML = `
                <div class="assessment-view">
                    ${ratingHTML}
                    ${initialAssessmentHTML}
                    ${listsHTML}
                    ${continueButtonHTML}
                </div>
            `;
            
            // Add event listener to the continue button
            const continueBtn = document.getElementById('continueBtn');
            if (continueBtn) {
                continueBtn.addEventListener('click', function() {
                    if (!savedAdvice || savedAdvice.trim() === '') {
                        alert('Detailed advice is not available. Please try submitting your form again.');
                        return;
                    }
                    showDetailedAdvice(savedAdvice);
                });
            }
        } else {
            // If no assessment JSON was found, just show the response as advice
            const htmlResponse = markdownToHtml(processedResponse.detailedAdvice || 'No advice available.');
            adviceContainer.innerHTML = htmlResponse;
        }
        
        // 4. Ensure the results section is visible and scroll to it
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
        
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Function to show detailed advice
    function showDetailedAdvice(adviceText) {
        // Validate adviceText
        if (!adviceText || adviceText.trim() === '') {
            adviceText = 'No detailed advice is available at this time.';
        }
        
        const htmlResponse = markdownToHtml(adviceText);
        
        // Create back button
        const backButton = document.createElement('button');
        backButton.className = 'btn back-btn';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Assessment';
        
        backButton.addEventListener('click', function() {
            // Direct manipulation of the DOM to recreate the assessment view
            if (savedAssessment) {
                // Recreate the assessment view
                const ratingHTML = createRatingVisualization(savedAssessment.rating);
                const initialAssessmentHTML = createInitialAssessment(savedAssessment);
                const listsHTML = createAssessmentLists(
                    savedAssessment.strengths, 
                    savedAssessment.weaknesses
                );
                const continueButtonHTML = createContinueButton();
                
                // Update the advice container
                adviceContainer.innerHTML = `
                    <div class="assessment-view">
                        ${ratingHTML}
                        ${initialAssessmentHTML}
                        ${listsHTML}
                        ${continueButtonHTML}
                    </div>
                `;
                
                // Add event listener to the continue button
                const continueBtn = document.getElementById('continueBtn');
                if (continueBtn) {
                    continueBtn.addEventListener('click', function() {
                        showDetailedAdvice(savedAdvice);
                    });
                } else {
                    console.error("Continue button not found after recreating assessment view");
                }
            } else {
                // If there's no saved assessment, show a message
                adviceContainer.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-circle"></i> Something went wrong</h3>
                        <p>We couldn't retrieve your assessment information.</p>
                        <button id="startOverBtn" class="btn" aria-label="Start new appeal"><i class="fas fa-redo"></i> Start New Appeal</button>
                    </div>
                `;
            }
        });
        
        // Create detailed advice HTML with additional information section
        adviceContainer.innerHTML = `
            <div class="detailed-advice" aria-label="Detailed advice results">
                ${htmlResponse}
            </div>
            <div class="additional-info-section" id="additional-info-section">
                <h3>Provide Additional Information</h3>
                <p>Is there anything else you'd like to add to strengthen your appeal?</p>
                <div class="form-group">
                    <textarea id="additional-info" name="additional-info" rows="5" placeholder="Add any other relevant details or circumstances that might help your case..."></textarea>
                </div>
                <button id="submit-additional-info" class="btn submit-btn" aria-label="Proceed to generate updated advice">
                    <i class="fas fa-sync-alt"></i> Generate Updated Advice
                </button>
            </div>
            
            <div id="updated-advice-container" class="updated-advice-container hidden">
                <div class="loading" id="updated-loading" aria-live="polite">
                    <div class="spinner" aria-label="Loading results" role="status"></div>
                    <p>Generating updated advice...</p>
                </div>
                <div id="updated-advice" class="updated-advice hidden">
                    <h3>Updated Appeal Advice</h3>
                    <div id="updated-advice-content"></div>
                </div>
            </div>
        `;
        
        // Add back button at the top
        adviceContainer.prepend(backButton);
        
        // Add event listener to the submit additional info button
        const submitBtn = document.getElementById('submit-additional-info');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                const additionalInfo = document.getElementById('additional-info').value.trim();
                
                if (additionalInfo.length < 10) {
                    // Show error if the input is too short
                    alert('Please provide more detailed additional information (at least 10 characters).');
                    return;
                }
                
                // Call the getDetailedAdvice function with the additional info
                getDetailedAdvice(savedFormData, savedAssessment, additionalInfo);
            });
        } else {
            console.error("Submit additional info button not found");
        }
        
        // Scroll to the advice
        adviceContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Store the original API response
    let savedAdvice = '';

    // Show API error
    function showApiError() {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        loadingIndicator.style.display = 'none';
        
        // Show error
        apiError.classList.remove('hidden');
        apiError.style.display = 'block';
        
        // Make sure results section is visible
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
    }

    // Simple markdown to HTML converter
    function markdownToHtml(markdown) {
        // Safety check to ensure markdown is a valid string
        if (!markdown || typeof markdown !== 'string') {
            console.error('Invalid markdown input:', markdown);
            return '<p>Error processing response</p>';
        }

        // Convert headers
        let html = markdown
            .replace(/^## (.*$)/gm, '<h3>$1</h3>')
            .replace(/^# (.*$)/gm, '<h2>$1</h2>');
        
        // Convert bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic text
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert unordered lists
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ul>\n');
        html = html.replace(/(?<!<\/ul>\n)(<li>)/g, '<ul>$1');
        
        // Convert numbered lists
        // This regex captures the actual number before the period
        const numberedListRegex = /^(\d+)\. (.*$)/gm;
        html = html.replace(numberedListRegex, function(match, number, content) {
            return '<li value="' + number + '">' + content + '</li>';
        });
        html = html.replace(/(<li value=.*<\/li>)\n(?!<li value=)/g, '$1</ol>\n');
        html = html.replace(/(?<!<\/ol>\n)(<li value=)/g, '<ol>$1');
        
        // Convert paragraphs
        html = html.replace(/^(?!<[houyl]|<li).+$/gm, '<p>$&</p>');
        
        // Fix any spacing issues
        html = html.replace(/>[\s]+</g, '><');
        
        return html;
    }
    
    // Form submission
    pcnForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep3()) {
            return;
        }
        
        // Collect form data
        const formData = {
            pcnType: pcnType.value,
            pcnReason: getSelectedRadioValue(pcnReasonRadios),
            pcnIssueDate: pcnIssueDate.value,
            incidentDate: incidentDate.value,
            stepsTaken: stepsTaken.value,
            explanation: explanation.value
        };
        
        // Clear previous content
        adviceContainer.innerHTML = '';
        savedAdvice = '';
        savedAssessment = null;
        
        // First hide the form
        appealFormSection.classList.add('hidden');
        appealFormSection.style.display = 'none';
        
        // Make results section visible but ensure the actual results are hidden
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block';
        
        resultsContainer.classList.add('hidden');
        resultsContainer.style.display = 'none';
        
        apiError.classList.add('hidden');
        
        // Make sure loading indicator is visible (both by class and style)
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.style.display = 'flex';
        
        try {
            // Call the Anthropic API
            const response = await callAnthropicAPI(formData);
            showResults(response);
        } catch (error) {
            console.error('API error:', error);
            showApiError();
        }
    });
    
    // Helper to get selected radio value
    function getSelectedRadioValue(radioButtons) {
        for (let i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].checked) {
                return radioButtons[i].value;
            }
        }
        return '';
    }
    
    // Call Anthropic API
    async function callAnthropicAPI(formData) {
        try {
            // Save form data globally
            savedFormData = {...formData};
            
            // Call backend API
            const response = await fetch('/api/generate-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            // Check if the request was successful
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                // Try to parse as JSON
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (parseError) {
                    console.error('Error parsing error response as JSON:', parseError);
                    throw new Error('An error occurred while generating advice');
                }
                
                throw new Error(errorData.message || 'An error occurred while generating advice');
            }
            
            // Try to parse the response as JSON
            let responseText;
            try {
                responseText = await response.text();
                
                // Save the original response
                originalApiResponse = responseText;
                
                const data = JSON.parse(responseText);
                return data.advice;
                
            } catch (parseError) {
                console.error('Error parsing API response as JSON:', parseError);
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error in API call:', error);
            throw error;
        }
    }

    // Function to get detailed advice
    async function getDetailedAdvice(formData, assessment, additionalInfo) {
        try {
            // Get direct references to the relevant elements
            const updatedAdviceContainer = document.getElementById('updated-advice-container');
            const updatedLoading = document.getElementById('updated-loading');
            const updatedAdvice = document.getElementById('updated-advice');
            
            // Show loading state
            updatedAdviceContainer.classList.remove('hidden');
            updatedAdviceContainer.style.display = 'block'; // Ensure container is visible
            
            updatedLoading.classList.remove('hidden');
            updatedLoading.style.display = 'flex'; // Use flex for loading spinner
            
            updatedAdvice.classList.add('hidden');
            updatedAdvice.style.display = 'none'; // Hide advice container
            
            // Scroll to the loading indicator
            updatedAdviceContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Create request payload
            const payload = {
                ...formData,
                initialAssessment: assessment.initial_assessment,
                additionalInfo: additionalInfo
            };
            
            // Call the API
            const response = await fetch('/api/generate-detailed-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // Check if request was successful
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error('An error occurred while generating detailed advice');
            }
            
            // Parse response
            const data = await response.json();
            
            // Hide the loading indicator using both class and style properties
            updatedLoading.classList.add('hidden');
            updatedLoading.style.display = 'none';
            
            // Display the updated advice
            updatedAdvice.classList.remove('hidden');
            updatedAdvice.style.display = 'block';
            
            const updatedAdviceContent = document.getElementById('updated-advice-content');
            
            // Update the content
            if (updatedAdviceContent) {
                updatedAdviceContent.innerHTML = markdownToHtml(data.detailedAdvice);
            }
            
        } catch (error) {
            console.error('Error getting detailed advice:', error);
            
            // Always hide the loading indicator in case of error
            const updatedLoading = document.getElementById('updated-loading');
            if (updatedLoading) {
                updatedLoading.classList.add('hidden');
                updatedLoading.style.display = 'none';
            }
            
            // Show error in the updated advice container
            const updatedAdviceContainer = document.getElementById('updated-advice-container');
            if (updatedAdviceContainer) {
                updatedAdviceContainer.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-circle"></i> Something went wrong</h3>
                        <p>We couldn't generate updated advice. Please try again.</p>
                        <p>Error: ${error.message}</p>
                        <button id="retry-updated-btn" class="btn"><i class="fas fa-sync"></i> Try Again</button>
                    </div>
                `;
                
                // Add event listener to retry button
                const retryBtn = document.getElementById('retry-updated-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', function() {
                        const additionalInfo = document.getElementById('additional-info').value.trim();
                        getDetailedAdvice(savedFormData, savedAssessment, additionalInfo);
                    });
                }
            }
        }
    }
})