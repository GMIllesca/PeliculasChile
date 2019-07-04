const PORT 			  = process.env.PORT || 3000;
const ENVIROMENT	  = process.env.ENVIROMENT || 'dev';
const express		  = require("express");
const session       = require('express-session')
const path          = require('path')
const logger        = require('morgan')
const cookieParser  = require('cookie-parser')
const helmet        = require('helmet')
const bodyParser	  = require('body-parser')

let home 		= require('./routes/home/index'),
	users 		= require('./routes/home/users')
	peliculas 	= require('./routes/home/peliculas')

let app = express()

/****************************************************************
 * http://expressjs.com/es/advanced/best-practice-security.html *
 ****************************************************************/
app.use(helmet())
app.disable('x-powered-by')
app.use(session({
  secret: 'kj5$·%2"·$$·"$oportunidades',
  resave: true,
  saveUninitialized: true
}))

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.use([
	// favicon(path.join(__dirname, 'public', 'favicon.ico')),// uncomment after placing your favicon in /public
	logger('dev'),
	bodyParser.urlencoded({ extended: true, limit: '1GB' }),
	bodyParser.json(),
	cookieParser(),
	express.static(path.join(__dirname, 'public'))
])

app.use('/', [home, peliculas, users])

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message
	res.locals.error = req.app.get('env') === 'development' ? err : {}

	// render the error page
	res.status(err.status || 500)
	res.render('error')
})

app.listen(PORT, () => {
  console.log(`Express server (${ENVIROMENT}) listening ON ${PORT}`)
})

module.exports = app
