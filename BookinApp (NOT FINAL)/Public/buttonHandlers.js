'use strict';
import { renderCalendar, updateBookings, initializeCalendar } from './script.js';

export async function fetchBookings(date) {
    try {
        const response = await fetch(`bookings.php?date=${encodeURIComponent(date)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Fel vid hämtning av bokningar.');

        const bookings = await response.json();
        console.log('(I FetchBookings:) Hämtade bokningar:', bookings);
        return bookings;
    } catch (error) {
        console.error('Fel vid hämtning av bokningar:', error);
        return [];
    }
}

function showLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
}

function addBookedClassToDay(bookingDate) {
    const dayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
    console.log(`Element hittat för datum ${bookingDate}:`, dayElement);
    if (dayElement) {
        dayElement.classList.add('booked');
        console.log(`Klass 'booked' tillagd för dagen: ${bookingDate}`);
        // Återställ kalendern
        initializeCalendar();
    } else {
        console.warn(`Ingen dag hittades för datumet: ${bookingDate}`);
    }
    // Återställ kalendern
    initializeCalendar();
}


export function updateCalendarWithBookings(bookings) {
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = ''; // Rensa listan först

    if (bookings.length === 0) {
        renderCalendar();
    } else {
        bookings.forEach(booking => {
            const bookingElement = document.createElement('li');

            // Format för bokningens data
            const formattedDate = new Date(booking.date).toISOString().split('T')[0];
            bookingElement.setAttribute('data-booking-id', booking.ID);
            bookingElement.setAttribute('data-booking-date', formattedDate);

            // Skapa spans för namn och tid
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('booking-name');
            nameSpan.textContent = booking.name;

            const timeSpan = document.createElement('span');
            timeSpan.classList.add('booking-time');
            timeSpan.textContent = `${booking.time_from} till ${booking.time_to}`;

            // Lägg till spans till bokningselementet
            bookingElement.appendChild(nameSpan);
            bookingElement.appendChild(timeSpan);

            // Lägg till klickbar funktion för att markera bokningen
            bookingElement.addEventListener('click', () => {
                document.querySelectorAll('#bookings-list li').forEach(li => li.classList.remove('selected'));
                bookingElement.classList.add('selected');
            });

            // Lägg till ny bokning med animation
            bookingsList.appendChild(bookingElement);
            bookingElement.classList.add('slide-in'); // Lägg till CSS-klass för animation
        });
    }
}



async function handleApiRequest(method, url, data = null) {
    showLoadingSpinner();

    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: data ? JSON.stringify(data) : null
        };

        const response = await fetch(url, options);
        const responseText = await response.text();

        console.log("Svar från servern:", responseText);

        if (!responseText || responseText.trim() === "") {
            throw new Error("Tomt eller ogiltigt svar från servern");
        }

        const result = JSON.parse(responseText);
        return result;
    } catch (error) {
        console.error("Fel vid API-anrop:", error);
        alert("Något gick fel vid anropet. Kontrollera servern.");
        throw error;
    } finally {
        hideLoadingSpinner();
    }
}

export async function handleBooking(event) {
    event.preventDefault();

    const bookingName = document.getElementById('booking-name').value.trim();
    const bookingDateElement = document.getElementById('booking-date');
    const bookingDate = bookingDateElement ? bookingDateElement.value : null;
    const timeFrom = document.getElementById('set-time-from').dataset.time || '';
    const timeTo = document.getElementById('set-time-to').dataset.time || '';

    console.log('BookingName:', bookingName);
    console.log('BookingDate-element:', bookingDateElement);
    console.log('BookingDate-värde:', bookingDate);
    console.log('TimeFrom:', timeFrom, 'TimeTo:', timeTo);

    if (!bookingName || !bookingDate || !timeFrom || !timeTo) {
        alert('Alla fält måste fyllas i för att boka.');
        return;
    }

    const newBooking = {
        booking_name: bookingName,
        booking_date: bookingDate,
        time_from: timeFrom,
        time_to: timeTo
    };

    try {
        const result = await handleApiRequest('POST', 'bookings.php', newBooking);
        if (result.message === 'Bokningen sparades framgångsrikt!') {
            // Uppdatera kalender och lägg till klassen 'booked' direkt
            addBookedClassToDay(bookingDate);
            const bookings = await fetchBookings(bookingDate);

            updateCalendarWithBookings(bookings);

            // Markera dagen som bokad (uppdatera sidan visuellt)
            const dayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
            if (dayElement) {
                dayElement.classList.add('booked');
                console.log(`Dag ${bookingDate} markerad som bokad.`);
                updateCalendarWithBookings(bookings);
                initializeCalendar();
            }
            
            // Återställ fälten efter bokningen
            document.getElementById('booking-name').value = '';
            document.getElementById('booking-date').value = '';
            document.getElementById('set-time-from').dataset.time = '';
            document.getElementById('set-time-from').textContent = 'Från';
            document.getElementById('set-time-to').dataset.time = '';
            document.getElementById('set-time-to').textContent = 'Till';

            const bookedDayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
                
            setTimeout(() =>{
                bookedDayElement.click(); // Simulerar ett klick på den avbokade dagen
            }, 1000);

        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Fel vid bokning:', error);
    }

    // Återställ kalendern
    initializeCalendar();
}






export async function handleCancel() {
    const selectedBooking = document.querySelector('#bookings-list li.selected');
    if (!selectedBooking) {
        console.error('Ingen bokning vald');
        return;
    }

    const bookingId = selectedBooking.getAttribute('data-booking-id');
    const bookingDate = selectedBooking.getAttribute('data-booking-date');
    
    if (!bookingDate) {
        console.error('Datum saknas för den valda bokningen');
        return;
    }

    try {
        // Ta bort bokningen via API
        const result = await handleApiRequest('DELETE', 'bookings.php', { remove_id: bookingId });
        console.log("Svar från servern:", result);

        // Hämta uppdaterad lista med bokningar för dagen
        const bookings = await fetchBookings(bookingDate);
        updateCalendarWithBookings(bookings);

        // Ta bort 'booked'-klassen om det inte finns några bokningar kvar för dagen
        if (bookings.length === 0) {
            const dayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
            if (dayElement) {
                dayElement.classList.remove('booked');
                const bookedDayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
                
                    setTimeout(() =>{
                        bookedDayElement.click(); // Simulerar ett klick på den avbokade dagen
                    }, 1000);
                    
                
                console.log(`Klass 'booked' togs bort från dagen: ${bookingDate}`);
            } else {
                console.warn(`Ingen dag hittades för datumet: ${bookingDate}`);
            }
        }
        // Rendera kalendern för att uppdatera visningen
        initializeCalendar();
        // Markera den avbokade dagen genom att simulera ett klick (avmarkerar den)
        const bookedDayElement = document.querySelector(`.day[data-date="${bookingDate}"]`);
        if (bookedDayElement) {
            setTimeout(() =>{
                bookedDayElement.click(); // Simulerar ett klick på den avbokade dagen
            }, 1000);
            
        }

        
        
    } catch (error) {
        console.error("Fel vid borttagning:", error);
    }
}




