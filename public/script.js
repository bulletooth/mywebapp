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
    
    // Add event listeners for form fields to provide real-time validation
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
    
    incidentDate.addEventListener('change', function() {
        incidentDateError.textContent = '';
        
        // Check if incident date is after issue date
        if (pcnIssueDate.value !== '' && incidentDate.value > pcnIssueDate.value) {
            incidentDateError.textContent = 'Incident date cannot be after PCN issue date';
        }
    });
    
    explanation.addEventListener('input', function() {
        if (explanation.value.trim().length >= 30) {
            explanationError.textContent = '';
        }
    });
    
    // Add keypress event listeners for better keyboard accessibility
    pcnForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Determine which step we're on and proceed accordingly
            if (step1.classList.contains('active')) {
                toStep2Btn.click();
            } else if (step2.classList.contains('active')) {
                toStep3Btn.click();
            } else if (step3.classList.contains('active')) {
                submitBtn.click();
            }
        }
    });
    
    // Action button event listeners
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
        
        // Show form and hide results
        appealFormSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Reset to first step
        showStep(1);
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

    // Show results
    function showResults(response) {
        console.log("Showing results, hiding loading indicator");
        
        // First, make sure the loading indicator is hidden
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none'; // Force immediate hide with inline style
            loadingIndicator.classList.add('hidden');
        } else {
            console.error("Loading indicator element not found!");
        }
        
        // Then show the results container
        if (resultsContainer) {
            resultsContainer.style.display = 'block'; // Force immediate show with inline style
            resultsContainer.classList.remove('hidden');
        } else {
            console.error("Results container element not found!");
        }
        
        // Process and display the advice
        if (adviceContainer) {
            // Validate response
            if (response && typeof response === 'string') {
                const htmlResponse = markdownToHtml(response);
                adviceContainer.innerHTML = htmlResponse;
            } else {
                adviceContainer.innerHTML = '<p>Sorry, we received an invalid response. Please try again.</p>';
                console.error("Invalid response received:", response);
            }
        } else {
            console.error("Advice container element not found!");
        }
        
        // Force a DOM reflow to ensure UI updates
        document.body.offsetHeight;
        
        // Ensure the results section is visible and scroll to it
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Show API error
    function showApiError() {
        loadingIndicator.classList.add('hidden');
        apiError.classList.remove('hidden');
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
        
        // Convert lists
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ul>\n');
        html = html.replace(/(?<!<\/ul>\n)(<li>)/g, '<ul>$1');
        
        // Convert numbered lists
        html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ol>\n');
        html = html.replace(/(?<!<\/ol>\n)(<li>)/g, '<ol>$1');
        
        // Convert paragraphs
        html = html.replace(/^(?!<[hou]|<li).+$/gm, '<p>$&</p>');
        
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
        
        // Show loading and hide form
        appealFormSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        apiError.classList.add('hidden');
        
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
            // Call your backend API instead of directly calling Anthropic
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
                
                // Try to parse as JSON, but handle the case where it's not JSON
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
            let data;
            try {
                const responseText = await response.text();
                console.log('Raw API Response:', responseText);
                
                // Try parsing the response text as JSON
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing API response as JSON:', parseError);
                throw new Error('Invalid response format from server');
            }
            
            return data.advice;
            
        } catch (error) {
            console.error('Error in API call:', error);
            throw error;
        }
    }
})