let express = require('express');
let router = express.Router();

let v1 = require('../../models/extractor/peliculas')

/* GET home page. */
router.get('/', function(req, res, next) {
	v1.listarCines()
	.then(r => {
		// console.log('data',JSON.stringify(r.data,null,4))

		res.render('index', { title: 'Listado de Cines', cines: r.data.cines })
	})
	.catch(e => {
		res.render('error', { message: 'wtf', error: {status: 500, stack: e} })
	})
})

router.get('/:cine', function(req, res, next) {
	v1.listarCines()
	.then(r => { return v1.listarSucursales(r.data.cines,req.params.cine) })
	.then(r => {
		// console.log(r)
		res.render('sucursales', { title: 'Listado de Sucursales', sucursales: r.sucursales })
	})
	.catch(e => {
		res.render('error', { message: 'wtf', error: {status: 500, stack: e} })
	})
})

router.get('/:cine/:sucursal', function(req, res, next) {
	v1.listarCines()
	.then(r => { return v1.listarSucursales(r.data.cines,req.params.cine) })
	.then(r => { return v1.listarPeliculas(r.sucursales,req.params.sucursal) })
	.then(r => {
		res.render('peliculas', { title: 'Listado de Peliculas', peliculas: r.peliculas })
	})
	.catch(e => {
		res.render('error', { message: 'wtf', error: {status: 500, stack: e} })
	})
})

router.get('/:cine/:sucursal/:pelicula', function(req, res, next) {
	v1.listarCines()
	.then(r => { return v1.listarSucursales(r.data.cines,req.params.cine) })
	.then(r => { return v1.listarPeliculas(r.sucursales,req.params.sucursal) })
	.then(r => { return v1.detallePelicula(r.peliculas,req.params.pelicula) })
	.then(r => {
		console.log(r.pelicula)
		res.render('detallePelicula',
		{ title: r.pelicula.titulo, pelicula: r.pelicula })
	})
	.catch(e => {
		res.render('error', { message: 'wtf', error: {status: 500, stack: e} })
	})
})


module.exports = router;
