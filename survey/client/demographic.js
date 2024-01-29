import * as SessionManagement from './SessionManagement.js';
import * as DataCollection from './DataCollection.js';
import { mobileCheck } from './MobileCheck.js';

(function() {

if (mobileCheck()) {
    alert('Evalvacija ne sme biti izvedena na mobilni napravi');
    return;
}

const session = SessionManagement.beginSession();

if (session.demographic) {
    location.href = 'survey.html';
    return;
}

const submitButton = document.querySelector('#submit');
const gender = document.querySelector('#gender');
const male = document.querySelector('#male');
const female = document.querySelector('#female');
const age = document.querySelector('#age');
const occupation = document.querySelector('#occupation');
const email = document.querySelector('#email');
const modeling = document.querySelector('#modeling');
const gaming = document.querySelector('#gaming');
const vr = document.querySelector('#vr');

function validateGender() {
    if (!male.checked && !female.checked) {
        gender.classList.add('invalid');
        return false;
    } else {
        gender.classList.remove('invalid');
        return true;
    }
}

function validateAge() {
    if (age.value == null || age.value <= 0 || age.value > 150) {
        age.classList.add('invalid');
        return false;
    } else {
        age.classList.remove('invalid');
        return true;
    }
}

function validateOccupation() {
    if (occupation.value == null || occupation.value === '') {
        occupation.classList.add('invalid');
        return false;
    } else {
        occupation.classList.remove('invalid');
        return true;
    }
}

male.addEventListener('change', validateGender);
female.addEventListener('change', validateGender);
age.addEventListener('change', validateAge);
occupation.addEventListener('change', validateOccupation);

function validate() {
    const validGender = validateGender();
    const validAge = validateAge();
    const validOccupation = validateOccupation();
    return validGender && validAge && validOccupation;
}

submitButton.addEventListener('click', async e => {
    if (!validate()) {
        return;
    }

    const genderValue = male.checked ? male.value : female.checked ? female.value : 'none';
    const ageValue = age.value;

    DataCollection.post({
        type: 'demographic',
        sessionID: session.sessionID,
        age: Number(ageValue),
        gender: genderValue,
        occupation: occupation.value,
        email: email.value,
        modeling: Number(modeling.value),
        gaming: Number(gaming.value),
        vr: Number(vr.value),
    });

    session.demographic = true;

    location.href = 'survey.html';
});

})();
