"use strict";
import { initDigitalClock, adjustClockSize, updateAnalogClock } from './klockor.js';
import { handleBooking, handleCancel } from './buttonHandlers.js';
import { fetchBookings, updateCalendarWithBookings } from './buttonHandlers.js';

const monthYearElem = document.getElementById('monthYear');
const calendarElem = document.getElementById('calendar');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
let allBookings = []; // Variabel för att lagra alla bokningar


let selectedDate = null; // Global variabel för att lagra markerat datum
let inactivityTimer = null;
let isTimerRunning = false; // Flagga för att kontrollera om timern redan körs



// Sätt mörkt läge hela tiden
document.body.classList.add('dark'); // Lägg till "dark" klassen på body

// Kontrollera om service worker stöds och registrera den
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker registrerad:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registrering misslyckades:', error);
            });
    });
}


  


// Kör våra klockfunktioner när sidan laddas
initDigitalClock();
adjustClockSize();
updateAnalogClock();

async function fetchBookingsFromJSON() {
    try {
        const response = await fetch('bookings.json');
        allBookings = await response.json();
        console.log('Alla bokningar:', allBookings); // Kontrollera att data laddas korrekt
    } catch (error) {
        console.error('Kunde inte hämta bokningar:', error);
    }
}

export async function initializeCalendar() {
    await fetchBookingsFromJSON(); // Vänta tills bokningarna laddas
    renderCalendar(); // Rendera kalendern
}

// Rendera alternativen som bubblor
function renderNameSuggestions() {
    const nameSuggestionsContainer = document.querySelector('.name_suggest'); // Få tag på name_suggest
    const bookingNameInput = document.getElementById('booking-name');

    // Lista över namnförslag
    const nameSuggestions = ['Witch','Anna', 'Charlotte', 'Ragmunk', 'Matilda', 'Anneli', 'Willy', 'Ricardo', 'Ulrika','Ven','Persson','Monique','Drasenare','Jelly','MarieKex','Corny','Ann','BestBoy','Ani'];
    nameSuggestions.sort();
    // Töm containern innan nya förslag renderas
    nameSuggestionsContainer.innerHTML = '';

    // Skapa namnförslagsbubblor
    nameSuggestions.forEach(name => {
        const suggestionBubble = document.createElement('div');
        suggestionBubble.classList.add('suggestion');  // Lägg till rätt klass
        suggestionBubble.textContent = name;

        // När en bubbla klickas, fyll i textfältet
        suggestionBubble.addEventListener('click', () => {
            bookingNameInput.value = name;
        });

        // Lägg till bubblan direkt i name_suggest
        nameSuggestionsContainer.appendChild(suggestionBubble);
    });
}

// Anropa funktionen för att visa namnförslag
renderNameSuggestions();









function renderBookings(bookingsForDay, allBookings) {
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = ''; // Rensa tidigare bokningar

    if (bookingsForDay.length > 0) {
        bookingsForDay.forEach(booking => {
            const existingBooking = document.querySelector(`#bookings-list li[data-booking-id="${booking.ID}"]`);
                console.log('innan existingBooking: ',existingBooking);
            if (!existingBooking) {
                allBookings.forEach(booking => {
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
                })
            }
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Det finns inga bokningar för detta datum.';
        li.classList.add('empty');
        bookingsList.appendChild(li);
    }
}

export async function updateBookings(bookingDate) {
    fetchBookings(bookingDate)
        .then(bookings => {
            if (!bookings || bookings.length === 0) {
                console.warn('Inga bokningar returnerades');
            } else {
                updateCalendarWithBookings(bookings);
                renderCalendar();
            }
        })
        .catch(error => {
            console.error('Fel vid uppdatering av bokningar:', error);
        });
        initializeCalendar();
}




let currentDate = new Date();
let year = currentDate.getFullYear();
const month = currentDate.getMonth();

function getIsoWeekNumber(date) {
    const currentDate = new Date(date);
    const dayNr = (currentDate.getDay() + 6) % 7;
    currentDate.setDate(currentDate.getDate() - dayNr + 3);
    const firstThursday = currentDate;
    const startOfYear = new Date(firstThursday.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((firstThursday - startOfYear) / 86400000 + 1) / 7);
    return weekNumber;
}

export function renderCalendar() {
    
    calendarElem.innerHTML = '';
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const today = new Date();
    let formatter = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });
    let monthYear = formatter.format(currentDate);
    monthYearElem.textContent = monthYear[0].toUpperCase() + monthYear.slice(1);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = startDay;
    const prevMonthStartDate = prevMonthLastDay.getDate() - prevMonthDays + 1;

    const weeks = [];
    let week = [];
    let weekNumber = getIsoWeekNumber(firstDay);

    for (let i = prevMonthStartDate; i <= prevMonthLastDay.getDate(); i++) {
        week.push({ day: i, isCurrentMonth: false });
    }

    for (let day = 1; day <= totalDays; day++) {
        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
        week.push({ day: day, isCurrentMonth: true, isToday: isToday });

        if (week.length === 7) {
            const allDaysDisabled = week.every(dayObj => !dayObj.isCurrentMonth);
            if (!allDaysDisabled) {
                weeks.push({ weekNumber: weekNumber, days: week });
            }
            weekNumber = getIsoWeekNumber(new Date(year, month, day + 1));
            week = [];
        }
    }

    let nextMonthDay = 1;
    while (week.length < 7) {
        week.push({ day: nextMonthDay, isCurrentMonth: false });
        nextMonthDay++;
    }

    if (!week.every(dayObj => !dayObj.isCurrentMonth)) {
        weeks.push({ weekNumber: weekNumber, days: week });
    }

    const daysOfWeek = ['Vecka', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
    daysOfWeek.forEach(day => {
        const veckoElem = document.createElement('div');
        veckoElem.classList.add('vecko-dagar');
        veckoElem.textContent = day;
        calendarElem.appendChild(veckoElem);
    });

    weeks.forEach(week => {
        const weekNumberElem = document.createElement('div');
        weekNumberElem.classList.add('week-number');
        weekNumberElem.textContent = 'Vecka ' + week.weekNumber;
        calendarElem.appendChild(weekNumberElem);

        week.days.forEach(day => {
            const dayElem = document.createElement('div');
            dayElem.classList.add('day');
            dayElem.textContent = day.day;
            dayElem.setAttribute('tabindex', '0');
        
            const dateString = `${year}-${(day.isCurrentMonth ? (month + 1) : (day.day > 15 ? month : month + 2)).toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;
            dayElem.setAttribute('data-date', dateString);
        
            // Om dagen är markerad
            if (selectedDate === dateString) {
                dayElem.classList.add('selected');
            }
        
            // Kontrollera bokningar
            if (allBookings && allBookings.bookings && Array.isArray(allBookings.bookings)) {
                const bookingsForDay = allBookings.bookings.filter(booking => booking.date === dateString);
                if (bookingsForDay.length > 0) {
                    dayElem.classList.add('booked');
        
                    // Gör dagen klickbar även om den inte är i nuvarande månad
                    day.isCurrentMonth = true;
                }
            }
        
            if (day.isToday) {
                dayElem.classList.add('today');
            }
        
            // Markera som disabled om inte i aktuell månad och utan bokningar
            if (!day.isCurrentMonth && !dayElem.classList.contains('booked')) {
                dayElem.classList.add('disabled');
                dayElem.setAttribute('aria-disabled', 'true');
                dayElem.setAttribute('tabindex', '-1');
            }
        
            // Klickhändelse för att markera dag
            dayElem.addEventListener('click', () => {
                if (!dayElem.classList.contains('disabled')) {
                    selectedDate = dateString; // Spara valt datum
                    document.querySelectorAll('.day').forEach(day => day.classList.remove('selected'));
                    dayElem.classList.add('selected');
        
                    document.getElementById('booking-date').value = dateString;
                    updateBookings(dateString);
                    renderBookings(dayElem, allBookings);
                    console.log('Valt datum:', dateString);
                }
            });
        
            calendarElem.appendChild(dayElem);
        });
            /*------------------------------------------------------------------
                                    Byt Bakgrunds Färgs knappen
            --------------------------------------------------------------------*/
            const colorOptions = [
                'linear-gradient(to bottom, rgb(231, 38, 198), rgb(85, 252, 224))',
                `linear-gradient(to bottom, #${getRandomColor()}, #${getRandomColor()})`, // Slumpmässig gradient
                'linear-gradient(to bottom, rgb(23,197,74), rgb(228,9,110))',
                `linear-gradient(to bottom, #${getRandomColor()}, #${getRandomColor()})`, // Slumpmässig gradient
                'linear-gradient(to bottom, #ff0000, #ffcc00)',
                'linear-gradient(to bottom, rgb(151, 21, 208), rgb(187, 27, 10))',
                'linear-gradient(to bottom, rgb(183, 42, 215), rgb(44, 170, 241))',
                'linear-gradient(to bottom, rgb(241, 163, 208), rgb(99, 95, 235))',
                'linear-gradient(to bottom, rgb(71, 57, 253), rgb(222, 174, 5))',
                'linear-gradient(to bottom, rgb(146, 252, 249), rgb(240, 117, 23))',
                'linear-gradient(to bottom, rgb(153, 237, 151), rgb(47, 49, 168))',
                'linear-gradient(to bottom, #007bff, #d1e7ff)' // Standard gradient
            ];

            let currentColorIndex = 0; // Startar med den första färgen (standard gradient)
            
            // Funktion för att generera slumpmässiga hex-färger
            function getRandomColor() {
                return Math.floor(Math.random()*16777215).toString(16); // Genererar en slumpmässig hex-färg
            }

            // Fånga knappen och lägg till en klickhändelse
            const button = document.querySelector('.button2');
            const roundedElement = document.querySelector('.rounded');
            const bookingElement = document.querySelector('.bookings');
            const fullElm = document.querySelector('.fullscreen-container');
            
            button.addEventListener('click', function() {
                // Uppdatera bakgrundsfärgen på .rounded elementet baserat på indexet i colorOptions
               // roundedElement.style.background = colorOptions[currentColorIndex];
               // bookingElement.style.background = colorOptions[currentColorIndex];
                fullElm.style.background = colorOptions[currentColorIndex]; 
                // Uppdatera indexet för nästa färg
                currentColorIndex++;

                // Om vi har kommit till slutet av vektorn, börja om från början
                if (currentColorIndex >= colorOptions.length) {
                    currentColorIndex = 0;
                }
            });
    });
    
}

document.addEventListener("DOMContentLoaded", function() {
    

    console.log('DOM laddad. Initierar event listeners...');

    const bookButton = document.getElementById('book-button');
    if (bookButton) {
        bookButton.addEventListener('click', handleBooking);
        console.log('Bokningsknappen är kopplad.');
    } else {
        console.error('Bokningsknappen hittades inte!');
    }

    const cancelButton = document.getElementById('cancelButton');
    if (cancelButton) {
        cancelButton.addEventListener('click', handleCancel);
        console.log('Avbokningsknappen är kopplad.');
    } else {
        console.error('Avbokningsknappen hittades inte!');
    }

    // Initiera kalender och övriga komponenter
    initializeCalendar();
    console.log('Kalendern är initierad.');
        

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    


// Eventlisteners
//document.getElementById('book-button').addEventListener('click', handleBooking);
//document.getElementById('cancelButton').addEventListener('click', handleCancel);

// Rendera kalender
//renderCalendar();



/*------------------------------------------------------------------
                TimePicker Modal:en för att ta ut tiderna.
--------------------------------------------------------------------*/

// Initiera Materialize Timepicker för det vanliga fältet
var elems = document.querySelectorAll('.timepicker');
var instances = M.Timepicker.init(elems, {
    twelveHour: false,
    defaultTime: '12:00',
    autoClose: true,
    vibrate: true,
});

var selectedField = null; // Variabel för att hålla reda på vilket fält användaren vill ändra
var tider = {
    fran: null, // För "Från" tid
    till: null   // För "Till" tid
};

// Funktion för att öppna Timepicker modal när "Välj Tid Från" trycks
document.getElementById("set-time-from").addEventListener("click", function() {
    selectedField = document.getElementById("set-time-from"); // Sätt "Tid Från" som det valda fältet
    var timepickerModal = document.getElementById("timepicker-modal");
    timepickerModal.style.display = "block";
    timepickerModal.classList.add("active"); // Lägg till animation för att visa

    var timepickerInput = document.getElementById("floating-timepicker");
    timepickerInput.click();  // Simulerar ett klick på timepicker inputfältet
});

// Funktion för att öppna Timepicker modal när "Välj Tid Till" trycks
document.getElementById("set-time-to").addEventListener("click", function() {
    selectedField = document.getElementById("set-time-to"); // Sätt "Tid Till" som det valda fältet
    var timepickerModal = document.getElementById("timepicker-modal");
    timepickerModal.style.display = "block";
    timepickerModal.classList.add("active"); // Lägg till animation för att visa

    var timepickerInput = document.getElementById("floating-timepicker");
    timepickerInput.click();  // Simulerar ett klick på timepicker inputfältet
});

// Lägg till eventlyssnare för knappen "Ok" i timepicker
var timepickerCloseBtns = document.querySelectorAll('.btn-flat.timepicker-close');
timepickerCloseBtns.forEach(function(btn) {
    if (btn.textContent.trim() === "Ok") {
        btn.addEventListener('click', function() {
            setTimeout(function() {
                document.getElementById("close-timepicker").click(); // Simulerar klick på OK-knappen
            }, 1000); // 1 sekund
        });
    }
});

// Stäng modal när användaren klickar på OK
document.getElementById("close-timepicker").addEventListener("click", function() {
    var timepickerModal = document.getElementById("timepicker-modal");
    var timepicker = M.Timepicker.getInstance(document.getElementById("floating-timepicker"));

    selectedField.dataset.time = timepicker.time; // Spara tiden i dataset
    selectedField.textContent = timepicker.time; // Uppdatera knappens text
    timepickerModal.style.display = "none"; // Stäng modal
    timepickerModal.classList.remove("active"); // Ta bort animation

    if (selectedField.id === "set-time-from") {
        tider.fran = timepicker.time;  // Spara "Från"-tid
    } else if (selectedField.id === "set-time-to") {
        tider.till = timepicker.time;  // Spara "Till"-tid
    }

    console.log("Från-tid sparad:", tider.fran);
    console.log("Till-tid sparad:", tider.till);
});

// Lägg till eventlyssnare för Cancel-knappen
var timepickerCancelBtn = document.querySelector('.btn-flat.timepicker-cancel');
if (timepickerCancelBtn) {
    timepickerCancelBtn.addEventListener('click', function() {
        var timepickerModal = document.getElementById("timepicker-modal");
        timepickerModal.style.display = "none"; // Stäng modal
        timepickerModal.classList.remove("active"); // Ta bort animation
    });
}

// Lägg till eventlyssnare för att stänga timepicker
document.getElementById("floating-timepicker").addEventListener('change', function() {
    setTimeout(function() {
        document.getElementById("close-timepicker").click(); // Simulerar klick på OK-knappen
    }, 1000); // 1 sekund
});

document.getElementById("floating-timepicker").addEventListener('blur', function() {
    setTimeout(function() {
        document.getElementById("close-timepicker").click(); // Simulerar klick på OK-knappen
    }, 1000); // 1 sekund
});  
   // renderCalendar();  
    
});

export function updateCalendar() {
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const currentDay = date.getDate();

    const prevMonth = document.querySelector('.prevMonth');
    prevMonth.addEventListener('click', function() {
        const prevMonthDate = new Date(currentYear, currentMonth - 1);
        updateCalendar(prevMonthDate);
    });

    const nextMonth = document.querySelector('.nextMonth');
    nextMonth.addEventListener('click', function() {
        const nextMonthDate = new Date(currentYear, currentMonth + 1);
        updateCalendar(nextMonthDate);
    });

    //renderCalendar();
}
function reloadAtMidnight() {
    const now = new Date(); // Hämta aktuell tid
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Nästa dag vid 00:00

    const timeUntilMidnight = tomorrow - now; // Millisekunder kvar till midnatt

    console.log(`Sidan kommer att uppdateras om ${timeUntilMidnight / 1000} sekunder.`);

    setTimeout(() => {
        location.reload(); // Uppdatera sidan vid midnatt
    }, timeUntilMidnight);
}

function startInactivityTimer() {
    if (isTimerRunning) return; // Om timern redan körs, gör inget

    isTimerRunning = true; // Sätt flaggan för att indikera att timern körs
    inactivityTimer = setTimeout(() => {
        resetFormAndReload();
        isTimerRunning = false; // Återställ flaggan när timern är klar
    }, 1 * 60 * 1000); // 3 minuter
}

function resetFormAndReload() {
    // Återställ namn och tider
    document.getElementById("booking-name").value = "";
    document.getElementById("set-time-from").textContent = "Från";
    document.getElementById("set-time-from").dataset.time = "";
    document.getElementById("set-time-to").textContent = "Till";
    document.getElementById("set-time-to").dataset.time = "";

    // Uppdatera sidan
    location.reload();
}

// Kontrollera om fält är ifyllda var 30:e sekund
setInterval(() => {
    const bookingName = document.getElementById("booking-name").value.trim();
    const timeFrom = document.getElementById("set-time-from").dataset.time || "";
    const timeTo = document.getElementById("set-time-to").dataset.time || "";

    // Starta timer endast om något fält är ifyllt och timern inte redan körs
    if ((bookingName || timeFrom !== '' || timeTo !== '') && !isTimerRunning) {
        console.log('Inaktivitet upptäckt, startar timern..');
        startInactivityTimer();
    }
}, 30 * 1000);

// Stoppa timern om "Boka" klickas
document.getElementById("book-button").addEventListener("click", () => {
    clearTimeout(inactivityTimer); // Stoppa timern
    isTimerRunning = false; // Återställ flaggan
    console.log("Timer stoppad vid bokning!");
});

// Uppdaterar vår sida vid midnatt
reloadAtMidnight();
