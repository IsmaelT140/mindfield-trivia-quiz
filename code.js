// Array that keeps track of used categories
let usedCategories = []
// Array that keeps track of used questions and clears after each category change
let usedQuestions = []

let currentQuestions = []
let totalScore = 0
let highScore = localStorage.getItem("highScore")
if (!highScore) highScore = 0

let questionNumber = 0

class Category {
	constructor(data) {
		this.id = data[0].category.id
		this.title = data[0].category.title
		this.cluesCount = data[0].category.clues_count
	}
}

class Question {
	constructor(data) {
		this.id = data.id
		this.question = data.question
		this.answer = removeHTML(data.answer)
	}
}

function removeHTML(string) {
	let div = document.createElement("div")
	div.innerHTML = string
	let text = div.textContent

	return text
}

async function fetchInfo(categoryId) {
	if (categoryId) {
		let response = await fetch(
			`https://jservice.io/api/clues?category=${categoryId}`
		)
		let data = await response.json()
		return data
	}
	let response = await fetch(`https://jservice.io/api/random`)
	let data = await response.json()
	return data
}

async function displayOnRequest() {
	// Asynchronous function that displays the random question as soon as the fetch request is processed.
	let category = new Category(await fetchInfo())

	if (checkForRepeats(category)) displayOnRequest()

	usedCategories.push(category)
	let randomCategoryId = category.id
	currentQuestions = await fetchInfo(randomCategoryId)

	let randomQuestion = getRandomQuestion()
	displayGame(randomQuestion)
}

function getRandomQuestion() {
	// Gets the maximum index that is available in the category array.
	max = currentQuestions.length - 1
	// Gets a random index within all possible indexes in the array.
	let index = Math.floor(Math.random() * max)
	let randomQuestion = currentQuestions[index]

	let questionIndex = currentQuestions.indexOf(randomQuestion)
	usedQuestions.push(currentQuestions.splice(questionIndex, 1))

	let question = new Question(randomQuestion)

	if (checkForRepeats(question)) {
		if (currentQuestions.length === 0) displayOnRequest()

		let newQuestion = getRandomQuestion()
		displayGame(newQuestion)
	}
	return question
}

function checkForRepeats(data) {
	if (data.title) {
		usedCategories.forEach((category) => {
			if (category.id === data.id) return true
		})
		return false
	}
	usedQuestions.forEach((question) => {
		if (question.id === data.id) return true
	})
	return false
}

function checkAnswer(answer, question) {
	// Check the user's answer by comparing it to the question answer after both have been converted to lowercase.
	// Update the scores and display the outcome of the last questions.
	if (answer.toLowerCase() === question.answer.toLowerCase()) {
		totalScore += 1
		if (totalScore > highScore) {
			highScore = totalScore
			localStorage.setItem("highScore", totalScore)
		}
		displayCorrectPage()
		return
	}
	displayGameOver()
}

// Display functions that display all of the information and pages.
let contentSection = document.getElementById("content")

function displayPage(onMainPage) {
	// Sets up the main containers for the content of the page in two different containers to be able to separate the content.
	let headerDiv = document.getElementById("header")
	headerDiv.textContent = ""
	contentSection.textContent = ""

	// Header section set up with score trackers
	let logo = document.createElement("img")
	logo.src = "./MindField Logo.png"
	logo.height = 100
	logo.width = 100
	let highScoreDiv = document.createElement("div")
	highScoreDiv.classList.add("score")
	let totalScoreDiv = document.createElement("div")
	totalScoreDiv.classList.add("score")

	let highScoreHeader = document.createElement("h3")
	highScoreHeader.innerText = "High Score:"
	let totalScoreHeader = document.createElement("h3")
	totalScoreHeader.innerText = "Total Score:"

	let highScoreElement = document.createElement("span")
	highScoreElement.id = "highScore"
	highScoreElement.innerText = ` ${highScore}`
	let totalScoreElement = document.createElement("span")
	totalScoreElement.id = "totalScore"
	totalScoreElement.innerText = ` ${totalScore}`

	highScoreHeader.append(highScoreElement)
	totalScoreHeader.append(totalScoreElement)
	highScoreDiv.append(highScoreHeader)
	totalScoreDiv.append(totalScoreHeader)

	if (onMainPage) {
		headerDiv.append(highScoreDiv, logo)
		return
	}
	headerDiv.append(highScoreDiv, logo, totalScoreDiv)
}

function displayHomePage() {
	totalScore = 0
	displayPage(true)

	let gameNameHeader = document.createElement("h1")
	gameNameHeader.innerText = "MindField"

	let startGameButton = document.createElement("button")
	startGameButton.id = "startGame"
	startGameButton.innerText = "Start Game"
	startGameButton.addEventListener("click", () => {
		displayOnRequest()
	})

	let gameRulesHeader = document.createElement("h3")
	gameRulesHeader.innerText = "Game Rules:"

	let gameRules = document.createElement("p")
	gameRules.innerText =
		"Make your way through a minefield of questions, in which you must get the right answer or you lose! Do you have what it takes?"

	contentSection.append(
		gameNameHeader,
		startGameButton,
		gameRulesHeader,
		gameRules
	)
}

function displayGame(questionObject) {
	displayPage()

	let questionParagraph = document.createElement("p")
	questionParagraph.id = "questionParagraph"
	if (questionObject) {
		questionParagraph.textContent = questionObject.question
	} else {
		questionObject = getRandomQuestion()
		questionParagraph.innerText = questionObject.question
	}

	let label = document.createElement("label")
	label.htmlFor = "answerInput"
	label.classList.add("form-label")
	label.innerText = "Answer"

	let answerInput = document.createElement("textarea")
	answerInput.id = "answerInput"
	answerInput.required = true
	answerInput.placeholder = "Enter your answer here..."
	answerInput.classList.add("form-control")

	answerInput.addEventListener("keyup", (event) => {
		if (event.code === "Enter") {
			let userAnswer = answerInput.value.toLowerCase()
			if (answerInput.value) {
				answerInput.value = ""
				userAnswer = removeHTML(userAnswer)
				// Removes the \n that gets added to the end when the user submits the answer.
				userAnswer = userAnswer.slice(0, userAnswer.length - 1)
				checkAnswer(userAnswer, questionObject)
			}
		}
	})

	let endGameButton = document.createElement("button")
	endGameButton.id = "endGame"
	endGameButton.innerText = "End Game"
	endGameButton.addEventListener("click", displayHomePage)

	contentSection.append(questionParagraph, label, answerInput, endGameButton)
}

function displayCorrectPage() {
	displayPage()

	let correctHeader = document.createElement("h1")
	correctHeader.innerText = "CORRECT"

	let scoreParagraph = document.createElement("p")
	scoreParagraph.innerText = "You earned 1 point."

	let nextQuestionButton = document.createElement("button")
	nextQuestionButton.id = "nextQuestion"
	nextQuestionButton.innerText = "Next Question"
	nextQuestionButton.addEventListener("click", () => {
		if (currentQuestions.length === 0) return displayOnRequest()
		let newQuestion = getRandomQuestion()
		displayGame(newQuestion)
	})

	let endGameButton = document.createElement("button")
	endGameButton.id = "endGame"
	endGameButton.innerText = "End Game"
	endGameButton.addEventListener("click", displayHomePage)

	contentSection.append(
		correctHeader,
		scoreParagraph,
		nextQuestionButton,
		endGameButton
	)
}

function displayGameOver() {
	displayPage()

	let gameOverHeader = document.createElement("h1")
	gameOverHeader.innerText = "GAME OVER"

	let scoreParagraph = document.createElement("p")
	scoreParagraph.innerText = `You scored ${totalScore} points.`

	let tryAgainButton = document.createElement("button")
	tryAgainButton.id = "tryAgain"
	tryAgainButton.innerText = "Try Again"
	tryAgainButton.addEventListener("click", displayHomePage)

	contentSection.append(gameOverHeader, scoreParagraph, tryAgainButton)
}

// Display the homepage whenever the page is loaded.
displayHomePage()
