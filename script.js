document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const personInputsDiv = document.getElementById('person-inputs');
    const addPersonBtn = document.getElementById('add-person-btn');
    const eventInputsDiv = document.getElementById('event-inputs');
    const addEventBtn = document.getElementById('add-event-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsDiv = document.getElementById('results');

    // Result display elements
    const totalGivenSpan = document.getElementById('total-given');
    const totalBillSpan = document.getElementById('total-bill');
    const totalPeopleSpan = document.getElementById('total-people');
    const equalShareSpan = document.getElementById('equal-share');
    const paymentList = document.getElementById('payment-list');

    let personCount = 1;
    let eventCount = 1;

    // --- INITIAL SETUP AND DATA LOADING ---

    // Load data from Local Storage first
    loadData();

    // If no saved data, ensure there's at least one input for person and event
    if (document.querySelectorAll('.person-group').length === 0) {
        addPersonInput(true);
    }
    if (document.querySelectorAll('.event-group').length === 0) {
        addEventInput(true);
    }

    // --- TEMPLATE GENERATION FUNCTIONS ---

    function createPersonGroup(name = '', amount = 0, isLocked = false) {
        personCount++;
        const group = document.createElement('div');
        group.classList.add('person-group');
        if (isLocked) group.classList.add('locked');

        group.innerHTML = `
            <input type="text" placeholder="Person Name ${personCount}" class="person-name" value="${name}">
            <input type="number" placeholder="Amount Paid" class="person-amount" min="0" value="${amount}">
            <button class="lock-btn">${isLocked ? '✅' : 'Lock'}</button>
        `;

        if (isLocked) {
            group.querySelector('.person-name').disabled = true;
            group.querySelector('.person-amount').disabled = true;
        }

        return group;
    }

    function createEventGroup(name = '', amount = 0, isLocked = false) {
        eventCount++;
        const group = document.createElement('div');
        group.classList.add('event-group');
        if (isLocked) group.classList.add('locked');

        group.innerHTML = `
            <input type="text" placeholder="Event Name ${eventCount}" class="event-name" value="${name}">
            <input type="number" placeholder="Amount Cost" class="event-amount" min="0" value="${amount}">
            <button class="lock-btn">${isLocked ? '✅' : 'Lock'}</button>
        `;

        if (isLocked) {
            group.querySelector('.event-name').disabled = true;
            group.querySelector('.event-amount').disabled = true;
        }

        return group;
    }

    function addPersonInput(isInitial = false) {
        const newGroup = createPersonGroup('', 0, false);
        personInputsDiv.insertBefore(newGroup, addPersonBtn);
        // Reset counter if it was just for placeholder text
        if (isInitial) personCount = 1;
        saveData();
    }

    function addEventInput(isInitial = false) {
        const newGroup = createEventGroup('', 0, false);
        eventInputsDiv.insertBefore(newGroup, addEventBtn);
        // Reset counter if it was just for placeholder text
        if (isInitial) eventCount = 1;
        saveData();
    }

    // --- LOCKING/TOGGLING FUNCTIONALITY ---

    function toggleLock(button) {
        const group = button.closest('.person-group') || button.closest('.event-group');
        
        if (!group) return; // Safety check

        const nameInput = group.querySelector('input[type="text"]');
        const amountInput = group.querySelector('input[type="number"]');

        if (group.classList.contains('locked')) {
            // Unlock
            group.classList.remove('locked');
            nameInput.disabled = false;
            amountInput.disabled = false;
            button.textContent = 'Lock';
        } else {
            // Lock - ensure name is not empty
            if (nameInput.value.trim() === '') {
                nameInput.value = nameInput.placeholder;
            }
            // Lock
            group.classList.add('locked');
            nameInput.disabled = true;
            amountInput.disabled = true;
            button.textContent = '✅';
        }
        saveData(); // Save state after lock/unlock
    }

    // --- CALCULATION LOGIC ---

    function calculateSplit() {
        const lockedPersonGroups = document.querySelectorAll('.person-group.locked');
        const lockedEventGroups = document.querySelectorAll('.event-group.locked');
        
        if (lockedPersonGroups.length === 0) {
            alert("Please enter and lock at least one person's details.");
            return;
        }

        // 1. Gather Person Data & Calculate Total Given
        let totalGiven = 0;
        const peopleData = [];

        lockedPersonGroups.forEach(group => {
            const name = group.querySelector('.person-name').value;
            const amount = parseFloat(group.querySelector('.person-amount').value) || 0; 
            
            totalGiven += amount;
            peopleData.push({ name, amount });
        });
        
        // 2. Calculate Total Event Cost (The Bill)
        let totalBill = 0;
        lockedEventGroups.forEach(group => {
            const amount = parseFloat(group.querySelector('.event-amount').value) || 0;
            totalBill += amount;
        });

        // 3. Final Calculations
        const numPeople = peopleData.length;
        const equalShare = totalBill / numPeople; // Each person's required contribution

        // 4. Display Overall Results
        totalGivenSpan.textContent = `BDT ${totalGiven.toFixed(2)}`;
        totalBillSpan.textContent = totalBill.toFixed(2);
        totalPeopleSpan.textContent = numPeople;
        equalShareSpan.textContent = equalShare.toFixed(2);
        
        // 5. Determine Balance for Each Person
        paymentList.innerHTML = ''; // Clear previous results
        
        peopleData.forEach(person => {
            // Balance = Amount Paid (Given) - Required Share (Bill / People)
            const balance = person.amount - equalShare;
            const li = document.createElement('li');
            
            if (balance > 0.01) {
                // Paid more than their share -> Gets money back (Lender)
                li.classList.add('gets');
                li.textContent = `${person.name} GETS BACK BDT ${balance.toFixed(2)} (${person.name} is owed)`;
            } else if (balance < -0.01) {
                // Paid less than their share -> Owes money (Ower)
                li.classList.add('owes');
                li.textContent = `${person.name} OWES BDT ${Math.abs(balance).toFixed(2)} (${person.name}'s required payment)`;
            } else {
                // Paid exactly the required share
                li.classList.add('even');
                li.textContent = `${person.name} is settled (Paid BDT ${person.amount.toFixed(2)})`;
            }
            paymentList.appendChild(li);
        });

        resultsDiv.classList.remove('hidden');
    }

    // --- LOCAL STORAGE PERSISTENCE ---

    function saveData() {
        // Gather Person data
        const people = Array.from(document.querySelectorAll('.person-group')).map(group => ({
            name: group.querySelector('.person-name').value,
            amount: group.querySelector('.person-amount').value,
            isLocked: group.classList.contains('locked')
        }));

        // Gather Event data
        const events = Array.from(document.querySelectorAll('.event-group')).map(group => ({
            name: group.querySelector('.event-name').value,
            amount: group.querySelector('.event-amount').value,
            isLocked: group.classList.contains('locked')
        }));

        const dataToSave = {
            people,
            events,
            personCount: personCount,
            eventCount: eventCount
        };
        
        localStorage.setItem('billSplitData', JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem('billSplitData');
        if (!savedData) return;

        const data = JSON.parse(savedData);
        
        // Remove initial placeholder groups
        document.querySelectorAll('.person-group').forEach(el => el.remove());
        document.querySelectorAll('.event-group').forEach(el => el.remove());

        // Update counters
        personCount = data.personCount || 0;
        eventCount = data.eventCount || 0;

        // Rebuild Persons
        data.people.forEach(p => {
            const newGroup = createPersonGroup(p.name, p.amount, p.isLocked);
            personInputsDiv.insertBefore(newGroup, addPersonBtn);
        });

        // Rebuild Events
        data.events.forEach(e => {
            const newGroup = createEventGroup(e.name, e.amount, e.isLocked);
            eventInputsDiv.insertBefore(newGroup, addEventBtn);
        });

        // Ensure the last generated group doesn't cause placeholder issues
        if (data.people.length > 0) personCount = data.people.length;
        if (data.events.length > 0) eventCount = data.events.length;
        
        // Automatically calculate if data was loaded and inputs exist
        if (data.people.some(p => p.isLocked)) {
            calculateSplit();
        }
    }

    // --- EVENT LISTENERS ---
    
    // Add Person/Event buttons
    addPersonBtn.addEventListener('click', () => addPersonInput(false));
    addEventBtn.addEventListener('click', () => addEventInput(false));

    // Calculate button
    calculateBtn.addEventListener('click', calculateSplit);

    // Event delegation for dynamically added lock buttons
    document.querySelector('.container').addEventListener('click', (e) => {
        if (e.target.classList.contains('lock-btn')) {
            toggleLock(e.target);
        }
    });

    // Event delegation for saving data on input changes
    document.querySelector('.container').addEventListener('input', (e) => {
        if (e.target.classList.contains('person-name') || 
            e.target.classList.contains('person-amount') ||
            e.target.classList.contains('event-name') ||
            e.target.classList.contains('event-amount')) {
            saveData();
        }
    });
});