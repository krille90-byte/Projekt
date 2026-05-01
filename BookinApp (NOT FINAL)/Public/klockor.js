
const clockElem = document.getElementById('clock'); // Klocka element

// Klockfunktioner
export function initDigitalClock() {
    var clock = $('#digital-clock'),
        alarm = clock.find('.alarm'),
        ampm = clock.find('.ampm');

    var digit_to_name = 'zero one two three four five six seven eight nine'.split(' ');

    var digits = {};

    var positions = [
        'h1', 'h2', ':', 'm1', 'm2', ':', 's1', 's2'
    ];

    var digit_holder = clock.find('.digits');

    $.each(positions, function(){
        if(this == ':'){
            digit_holder.append('<div class="dots">');
        } 
        else{ 
            var pos = $('<div>');

            for(var i=1; i<8; i++){
                pos.append('<span class="d' + i + '">'); 
            }

            digits[this] = pos;
            digit_holder.append(pos);
        }
    });

    var weekday_names = 'SÖN MÅN TIS ONS TOR FRE LÖR'.split(' '),
        weekday_holder = clock.find('.weekdays');

    $.each(weekday_names, function(){
        weekday_holder.append('<span>' + this + '</span>');
    });

    var weekdays = clock.find('.weekdays span');

    (function update_time(){
        var now = moment().format("HHmmssd"); // 24-timmarsformat (HH)
        digits.h1.attr('class', digit_to_name[now[0]]);
        digits.h2.attr('class', digit_to_name[now[1]]);
        digits.m1.attr('class', digit_to_name[now[2]]);
        digits.m2.attr('class', digit_to_name[now[3]]);
        digits.s1.attr('class', digit_to_name[now[4]]); 
        digits.s2.attr('class', digit_to_name[now[5]]);

        var dow = now[6]; 
        weekdays.removeClass('active').eq(dow).addClass('active');

        ampm.text('');  // Ta bort am/pm (24-timmarsformat)

        setTimeout(update_time, 1000);
    })();

    $('a.button').click(function(){
        clock.toggleClass('light dark');
    });
}

export function adjustClockSize() {
    const clock = document.getElementById('digital-clock');
    const containerWidth = clock.offsetWidth;
    const fontSize = Math.min(containerWidth / 5, 100);
    clock.style.fontSize = fontSize + 'px';
}

export function updateAnalogClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;

    document.getElementById('secondHand').style.transform = `rotate(${secondDeg}deg)`;
    document.getElementById('minuteHand').style.transform = `rotate(${minuteDeg}deg)`;
    document.getElementById('hourHand').style.transform = `rotate(${hourDeg}deg)`;
}


setInterval(() => {
    updateAnalogClock();
}, 1000);