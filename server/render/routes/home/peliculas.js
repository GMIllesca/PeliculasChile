let express = require('express')
let router = express.Router(),
    v1 = require('../../models/extractor/peliculas')

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource')
});

router.post('/dummy', function(req, res, next) {
    v1.dummy(req, res)
    .then(r => {
        res.send(r)
    })
})

router.post('/dummyJSON', function(req, res, next) {
	v1.dummyJSON(req, res)
	.then(r => {
		 res.send(r)
	})
})

router.post('/dummyFicha', function(req, res, next) {
	v1.dummyFicha(req, res)
	.then(r => {
		 res.send(r)
	})
})

router.post('/iniciarScrapper', function(req, res, next) {
    v1.iniciarScrapper()
    .then(r => {
        res.send(r)
    })
    .catch(e => {
        res.send(
            {
                error: 500,
                mensaje: e
            }
        )
    })
})

router.post('/listarPeliculas', function(req, res, next) {
	v1.listarPeliculas()
	.then(r => {
		 res.send(r)
	})
	.catch(e => {
		 res.send(
			  {
					error: 500,
					mensaje: e
			  }
		 )
	})
})

module.exports = router;
