const synth = window.speechSynthesis;

const inputTxt = document.querySelector(".txt");

const playButton = document.querySelector("#play");
const checkButton = document.querySelector("#check");

let voices = [];
let amt;
let utterThis;

function populateVoiceList() {
	console.log("populateVoiceList");
	voices = synth.getVoices().filter(voice => {
		return voice.lang.includes('IT');
	});
	console.log("Voices populated");
}

function getRandomVoice() {
	console.log("get random voice")
	console.log(voices);
	const randomIndex = Math.floor(Math.random() * voices.length);
	return voices[randomIndex];
}

function skewedRandom(max) {
	const randomSq = Math.random() * Math.random();
	return Math.floor(randomSq * (max + 1)) + 1;
}

function getRandomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
	return Math.floor(getRandomNumber(min, max));
}

function getRandomDollarAmount() {
	console.log("AA")
	const digits = skewedRandom(4);
	const max = Math.pow(10, digits) - 1;
	const euros = getRandomInt(1, max);
	const cents = getRandomInt(0, 99);
	console.log(`digits: ${digits} max:${max} euros: ${euros} cents: ${cents}`);
	return getTotalAndText(euros, cents);
}

function getTotalAndText(euros, cents) {
	const total = parseFloat((euros + (cents / 100)).toFixed(2));
	const text = getText(euros, cents);
	return { total, text};
}

function getText(euros, cents) {
	let text = `${euros} euro`
	if (cents) {
		text += ` e ${parseInt(cents)}`
	}
	console.log(text);
	return text;
}

function speak() {
	console.log("============ speak", utterThis);
	console.log(synth);
	if (synth.speaking) {
		console.error("speechSynthesis.speaking");
		synth.cancel();
	}

	
	synth.speak(utterThis);
}

play.onclick = function (event) {
	console.log("play.onclick");
	event.preventDefault();

	speak();

	inputTxt.blur();
};

checkButton.onclick = function () {
	console.log("checks.onclick");
	if (inputTxt.value == amt.total) {
		alert("Correct!!");
		inputTxt.value = '';
		setup();
	} else {
		alert("Wrong!!");
	}
}

function getUtterance() {
	console.log("efgegeg=======")
	utterThis = new SpeechSynthesisUtterance(amt.text);

	utterThis.onend = function (event) {
		console.log("SpeechSynthesisUtterance.onend");
	};

	utterThis.onerror = function (event) {
		console.error("SpeechSynthesisUtterance.onerror", event);
	};

	utterThis.voice = getRandomVoice();
	utterThis.pitch = getRandomNumber(0.7, 1.2);
	utterThis.rate = getRandomNumber(0.9, 1.5);
	console.log(`Utterance pitch: ${utterThis.pitch} rate: ${utterThis.rate}`);
	return utterThis;
}

function setup() {
	console.log("AAA --- setup");
	amt = getRandomDollarAmount();
	utterThis = getUtterance()
	speak();
}

if (speechSynthesis.onvoiceschanged !== undefined) {
	speechSynthesis.onvoiceschanged = onVoicesChanged;
}

function onVoicesChanged() {
	console.log("voices changed ========")
	populateVoiceList();
	setup();
}
 