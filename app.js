const express = require('express')
const app = express()

app.use(express.json())

const login = require('./routes/loginRoute')

app.use("",login)

module.exports = app