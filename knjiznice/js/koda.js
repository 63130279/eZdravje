var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
 var sessionId = getSessionId();
 var ehrId = "";
    $.ajax({
        url: 'https://randomuser.me/api/?nat=us,gb,de&inc=name',
        dataType: 'json',
        success: function(data) {
            switch(stPacienta)
            {
                case(1):  // oseba z idealnimi vitalnimi znaki
                     var date = new Date(1920, 0, 1)
                     var ime = "Peter";
                     var priimek = "Prevc";
                     var rojstvo_dan = new Date(1992, 9, 21);
                     var rojstvo_ura = "10:21";
                     var initTeza = 75;
                     var initVisina = 182;
                     break;
                case(2):  // oseba z povprečnimi vitalnimi znaki
                     var date = new Date(1981, 10, 10)
                     var ime = "Damjan";
                     var priimek = "Murko";
                     var rojstvo_dan = new Date(1979, 1, 30);
                     var rojstvo_ura = "06:23";
                     var initTeza = 82;
                     var initVisina = 176;
                     break;
                case(3):  // oseba z slabimi vitalnimi znaki
                     var date = new Date(2000, 5, 11)
                     var ime = "France";
                     var priimek = "Debeljak";
                     var rojstvo_dan = new Date(1942, 4, 38);
                     var rojstvo_ura = "06:23";
                     var initTeza = 85;
                     var initVisina = 172;
                     break;
                
            var datumRojstva = rojstvo_dan + "T" + rojstvo_ura; 
            }
            $.ajaxSetup({
                    headers: {
                        "Ehr-Session": sessionId
                    }
                });
                $.ajax({
                    url: baseUrl + "/ehr",
                    type: 'POST',
                    success: function(data) {
                        var ehrId = data.ehrId;
                        var partyData = {
                            firstNames: ime,
                            lastNames: priimek,
                            dateOfBirth: datumRojstva,
                            partyAdditionalInfo: [{
                                key: "ehrId",
                                value: ehrId
                            }]
                        };

                        $.ajax({
                            url: baseUrl + "/demographics/party",
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(partyData),
                            success: function(party) {
                                if (party.action == 'CREATE') {

                                    var success = function() {
                                        sestaviSporocilo("#pripni", "success", true,
                                            "<span class='patient-special'>" + ime + " " + priimek + "</span>, EHR ID: <span class='patient-special'>" + ehrId + "</span>"
                                        );
                                    }

                                    vnosVitalnihMeritev(ehrId, true, true, initTeza, initVisina);
                                    vnosVitalnihMeritev(ehrId, true, true, initTeza, initVisina + 2);
                                    vnosVitalnihMeritev(ehrId, true, true, initTeza , initVisina + 2);
                                    vnosVitalnihMeritev(ehrId, true, true, initTeza, initVisina + 2);
                                    vnosVitalnihMeritev(ehrId, true, true, initTeza, initVisina + 2, success);
                                }
                            },
                            error: function(err) {
                                sestaviSporocilo("#pripni", "danger", false, "Napaka: " + JSON.parse(err.responseText).userMessage);
                            }
                        });
                    }
                });
            }
        
    });
    return ehrId;
}
function getByEhrId(vrednost)
{
    var sessionId = getSessionId();
        var AQL = "select " +
        "a_a/data[at0002]/events[at0003]/time as time, " +
        "a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temp, " +
        "a_f/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as pulse, " +
        "a_b/data[at0001]/events[at0006]/data[at0003]/items[at0005]/value/magnitude as diastolic, " +
        "a_d/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as weight, " +
        "a_b/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude as systolic, " +
        "a_c/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/magnitude as d_height, " +
        "a_g/data[at0001]/events[at0002]/data[at0003]/items[at0006]/value/numerator as oximetry " +
        "from EHR e[ehr_id/value='" + vrednost + "'] " +
        "contains COMPOSITION a " +
        "contains ( " +
        "OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_temperature.v1] or " +
        "OBSERVATION a_b[openEHR-EHR-OBSERVATION.blood_pressure.v1] or " +
        "OBSERVATION a_c[openEHR-EHR-OBSERVATION.height.v1] or " +
        "OBSERVATION a_d[openEHR-EHR-OBSERVATION.body_weight.v1] or " +
        "OBSERVATION a_f[openEHR-EHR-OBSERVATION.heart_rate-pulse.v1] or " +
        "OBSERVATION a_g[openEHR-EHR-OBSERVATION.indirect_oximetry.v1] ) " +
        "order by a_a/data[at0002]/events[at0003]/time desc " +
        "offset 0 limit 1";
    
    
    
     $.ajax({
        url: baseUrl + "/query?" + $.param({
            "aql": AQL
        }),
        type: 'GET',
        headers: {
            "Ehr-Session": sessionId
        },
        success: function(res) {
            if (res) {
                var rows = res.resultSet;
                for (var i in rows) {
                    nastaviPodatkeIzvida(rows[i].d_height, rows[i].weight, rows[i].temp, rows[i].systolic, rows[i].diastolic, rows[i].oximetry, rows[i].pulse);
                }
            } else {
                nastaviPodatkeIzvida(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
                sestaviSporocilo("#pripni", "warning", true, "Ni podatkov ali so pomankljivi, vnesite vzorčne meritve!");
            }
        },
        error: function(err) {
            sestaviSporocilo("#pripni", "danger", true, "Napaka: " + JSON.parse(err.responseText).userMessage);
        }
});
    
}
function vnosVitalnihMeritev(pacient, globalno, random, teza, visina, callback) {
    var ehr = $("#EHR_ID_ACTIVE").val();
    if (pacient != "") ehr = pacient;

    var sessionId = getSessionId();

    var datumInUra, telesnaVisina, telesnaTeza, telesnaTemperatura,
        sistolicniKrvniTlak, sistolicniKrvniTlak, diastolicniKrvniTlak,
        srcniUtrip, nasicenostKrviSKisikom, nasicenostKrviSKisikom, merilec;

    if (!random) {
        var date = new Date();

        datumInUra = date.getFullYear() + "-" + popraviCas(date.getMonth() + 1) + "-" + popraviCas(date.getDate()) + "T" + popraviCas(date.getHours()) + ":" + popraviCas(date.getMinutes()) + ":" + popraviCas(date.getSeconds());
        telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
        telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
        telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
        sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
        diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
        srcniUtrip = $("#dodajSrcniUtrip").val();
        nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
        merilec = "medicinska sestra Maja";
    } else {
    var date = new Date();

        datumInUra = date.getFullYear() + "-" + popraviCas(date.getMonth() + 1) + "-" + popraviCas(date.getDate()) + "T" + popraviCas(date.getHours()) + ":" + popraviCas(date.getMinutes()) + ":" + popraviCas(date.getSeconds());
        telesnaVisina = visina;
        telesnaTeza = teza;
        telesnaTemperatura = 36;;
        sistolicniKrvniTlak = 120;
        diastolicniKrvniTlak = 85;
        srcniUtrip = 65;
        nasicenostKrviSKisikom = 96;
        merilec = "medicinska sestra Maja";
    }


    if (!ehr || ehr.trim().length == 0) {
        if (!globalno) sestaviSporocilo("#pripni", "warning", false, "Prosimo vnesite zahtevane podatke!");
        else sestaviSporocilo("#pripni", "warning", true, "Napaka: Podatki niso v celoti vnešeni!");
    } else {

        $.ajaxSetup({
            headers: {
                "Ehr-Session": sessionId
            }
        });

        var podatki = {
            "ctx/language": "en",
            "ctx/territory": "SI",
            "ctx/time": datumInUra,
            "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
            "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
            "vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
            "vital_signs/body_temperature/any_event/temperature|unit": "°C",
            "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
            "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
            "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom,
            "vital_signs/pulse:0/any_event:0/rate|magnitude": srcniUtrip,
            "vital_signs/pulse:0/any_event:0/rate|unit": "/min"
        };

        var parametriZahteve = {
            ehrId: ehr,
            templateId: 'Vital Signs',
            format: 'FLAT',
            committer: merilec
        };

        $.ajax({
            url: baseUrl + "/composition?" + $.param(parametriZahteve),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(podatki),
            success: function(res) {
                if (callback) callback();
                if (!globalno) sestaviSporocilo("#pripni", "success", false, "Meritve uspešno vnesene. Osvežite podatke!");
            },
            error: function(err) {
                if (!globalno) sestaviSporocilo("#pripni", "danger", false, "Napaka: " + JSON.parse(err.responseText).userMessage);
                else sestaviSporocilo("#pripni", "danger", true, "Napaka: " + JSON.parse(err.responseText).userMessage);
            }
        });

    }
}
 function nastaviPostavkeIzvida(postavka, vrednost, enota, omejitve) {
    if (vrednost !== undefined && vrednost !== '' && vrednost != null && !isNaN(vrednost)) $(postavka).children().eq(1).html(zaokrozi(vrednost) + " " + enota);
    else $(postavka).children().eq(1).html("-");
    $(postavka).children().eq(2).html("normal");
}
 function nastaviPodatkeIzvida(height, weight, temp, preasure1, preasure2, blood, pulse) {
    $('.patient-detail-info').hide();
    nastaviPostavkeIzvida("#patient-height", height, "cm", 1);
    nastaviPostavkeIzvida("#patient-weight", weight, "kg", 2);

    var bmi = Math.round(parseFloat(weight) / (Math.pow(parseFloat(height) / 100, 2)) * 100) / 100;
    if (weight === undefined || height === undefined) bmi = undefined;

    nastaviPostavkeIzvida("#patient-bmi", bmi, "", 3);
    nastaviPostavkeIzvida("#patient-temperature", temp, "˚C", 4);
    nastaviPostavkeIzvida("#patient-pressure-1", preasure1, "", 5);
    nastaviPostavkeIzvida("#patient-pressure-2", preasure2, "", 6);
    nastaviPostavkeIzvida("#patient-blood", blood, "%", 7);
    nastaviPostavkeIzvida("#patient-pulse", pulse, "", 8);
    $('.patient-detail-info').fadeIn();
}
function sestaviSporocilo(location, type, append, message) {
    var message =
        `<div class="msg alert alert-` + type + ` alert-dissmissable" role="alert" style="display: none;">
        <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
        ` + message + `
    </div>`;

    if (append) $(message).appendTo($(location)).fadeIn();
    else {
        $(location).html('');
        $(message).appendTo($(location)).fadeIn();
    }

}
function popraviCas(time) {
    if (time == 0) return "00";
    if (parseInt(time) < 10) return "0" + time;
    else return time;
}
// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
