let del = require('del')
let request = require('request')
let cheerio = require('cheerio')
let iconv = require('iconv-lite')
let moment = require('moment')
let image_downloader = require('image-downloader')
let vibrant = require('node-vibrant')
let _ = require('underscore')
let fs = require('fs')

let config = {
	// carpetas: [`${process.cwd()}/public/images/normal/`, `${process.cwd()}/public/images/blur/`]
	carpetas: [`${process.cwd()}/public/images/peliculas/`],
	carpetaData: `${process.cwd()}/../data/`,
	jsonFile: `${process.cwd()}/../data/${+moment()}_.json`
}
let self = {
	dummy: (req, res, next) => {
		return new Promise((resolve, reject) => {
			resolve({ error: 500, mensaje: "test" })
		})
	},
	dummyJSON: (req, res, next) => {
		return self._guardarJson()
	},
	dummyFicha: (req, res, next) => {
		return self._obtenerHTML('http://www.800.cl/?id=1101&id_Ficha=4704')
		.then((r) => {
			return self._obtenerFicha(r)
		})
	},
	listarCines: (req, res, next) => {
		return new Promise((Resolve, Reject) => 
			fs.readdir(config.carpetaData, (err, items) => {
				if(err) return Reject(err)

				fs.readFile(config.carpetaData + items[items.length-1], (err, data) => {
					if(err) return Reject(err)

					return Resolve({error: 0, mensaje: '', data: JSON.parse(data.toString('utf8'))})
				})

			})
		)
	},
	listarSucursales: (data,cine) => {
		return new Promise((Resolve,Reject) => {

			let retorno = _.filter(data, (v,i) => {
				return v.nombre == cine
			})
			
			return Resolve({data: data, sucursales: retorno[0].sucursales})

		})
	},
	listarPeliculas: (data,sucursal) => {
		return new Promise((Resolve,Reject) => {
			
			let retorno = _.filter(data, (v,i) => {
				return v.id_Ficha == sucursal
			})

			return Resolve({data: data, peliculas: retorno[0].peliculas})

		})
	},
	detallePelicula: (data,pelicula) => {
		return new Promise((Resolve,Reject) => {
			
			let retorno = _.filter(data, (v,i) => {
				return v.titulo == pelicula
			})

			return Resolve({data: data, pelicula: retorno[0]})

		})
	},
	ordenarPorPelicula: (todo) => {
		let data =[] 
		return new Promise((Resolve,Reject) => {
			todo.data.cines.forEach((c,l) => {
				c.sucursales.forEach((s,ll) => {
					s.peliculas.forEach((p,ll) => {
						p.cine = c.nombre
						p.sucursal = s.nombre
						data.push(p)
						if(l == todo.data.cines.length-1){
							return Resolve(data)
						}
					})
				})
			})
		})
	},
	peliculas: {
		link: "http://www.800.cl",
		cines: [
			{
				nombre: "Cine Planet",
				id: 1097,
				sucursales: [
					{
						nombre: "Portal La Dehesa",
						id_Ficha: 342,
						peliculas: {}
					},
					{
						nombre: "Florida Center",
						id_Ficha: 4022,
						peliculas: {}
					},
					{
						nombre: "Costanera Center",
						id_Ficha: 8340,
						peliculas: {}
					},
					{
						nombre: "Plaza Alameda",
						id_Ficha: 4016,
						peliculas: {}
					},
					{
						nombre: "Paseo Quilín",
						id_Ficha: 9592,
						peliculas: {}
					},
				]
			},
			{
				nombre: "Cines Hoyts",
				id: 1097,
				sucursales: [
					{
						nombre: "La Reina",
						id_Ficha: 642,
						peliculas: {}
					},
					{
						nombre: "San Agustin",
						id_Ficha: 643,
						peliculas: {}
					},
					{
						nombre: "Estación Central",
						id_Ficha: 640,
						peliculas: {}
					},
					{
						nombre: "Puente Alto",
						id_Ficha: 667,
						peliculas: {}
					},
					{
						nombre: "Parque Arauco",
						id_Ficha: 650,
						peliculas: {}
					},
					{
						nombre: "Maipú",
						id_Ficha: 682,
						peliculas: {}
					},
					{
						nombre: "Los Trapenses",
						id_Ficha: 3880,
						peliculas: {}
					},
					{
						nombre: "Quilicura",
						id_Ficha: 8833,
						peliculas: {}
					},
					{
						nombre: "Plaza Egaña",
						id_Ficha: 10074,
						peliculas: {}
					},
					{
						nombre: "Paseo San Bernardo",
						id_Ficha: 10115,
						peliculas: {}
					}
				]
			},
			{
				nombre: "Cinemark",
				id: 1097,
				sucursales: [
					{
						nombre: "Alto Las Condes",
						id_Ficha: 633,
						peliculas: {}
					},
					{
						nombre: "Plaza Vespucio",
						id_Ficha: 637,
						peliculas: {}
					},
					{
						nombre: "Gran Avenida",
						id_Ficha: 634,
						peliculas: {}
					},
					{
						nombre: "Plaza Tobalaba",
						id_Ficha: 636,
						peliculas: {}
					},
					{
						nombre: "Plaza Oeste",
						id_Ficha: 635,
						peliculas: {}
					},
					{
						nombre: "Plaza Norte",
						id_Ficha: 4020,
						peliculas: {}
					},
					{
						nombre: "Portal Ñuñoa",
						id_Ficha: 7792,
						peliculas: {}
					}
				]
			},
		]
	},
	iniciarScrapper: (req, res, next) => {
		return new Promise((resolve, reject) => {
			self._limpiarCarpetas()
			.then(lll => {
				return Promise.all(
					self.peliculas.cines.map((cine, x) =>
						Promise.all(cine.sucursales.map((sucursales, y) =>
							self._obtenerHTML(`${self.peliculas.link}/?id=${cine.id}&id_Ficha=${sucursales.id_Ficha}`)
								.then(r => { return self._obtenerCartelera(r) })
								.then(peliculas =>
									Promise.all(peliculas.map((p) => {
										if (p.data != "") {
											return self._obtenerHTML(self.peliculas.link + p.data.href)
												.then(l => { return self._obtenerFicha(l) })
												.then(l => {
													p.data.ficha = l.data
												})
												.then(l => { return self._obtenerHTML(`${self.peliculas.link}/FichaPeliculaCarac.asp?i=${sucursales.id_Ficha}&g=35`) })
												.then(l => { return self._obtenerGenero(l) })
												.then(l => {
													p.data.ficha.genero = l
												})
												.then(l => { return self._obtenerImagen(p.data.imagen.original) })
												.then(l => {
													if (l.error != 0) {
														p.data.imagen.normal = l
													} else {
														p.data.imagen.normal = l.data
													}
												})
												.then(l => { return self._obtenerColorPredominante(p.data.imagen.normal) })
												.then(l => {
													if (l.error != 0) {
														p.data.imagen.colorPredominante = l
													} else {
														p.data.imagen.colorPredominante = l.data
													}
												})
												.then(l => {
													return p.data
												})
										} else {
											return p.data
										}
									}
									), Promise.resolve())
								)
								.then(r => {
									sucursales.url = `${self.peliculas.link}/?id=${cine.id}&id_Ficha=${sucursales.id_Ficha}`
									sucursales.peliculas = r
								})
								.then(r => {
									return sucursales
								})
						))
						.then(r => {
							return r
						})
					)
				)
				.then((r) => {
					return self._guardarJson()
				})
				.then(r => {
					return self.peliculas
				})
				.catch(e => {
					Reject(e)
				})
			})
			.then(r => {
				return resolve(r)
			})
			.catch(e => {
				console.log('error', e)
				reject(e)
			})
		})
	},
	_limpiarCarpetas: () => {
		return new Promise((resolve, reject) => {
			del(config.carpetas.map((v) => { return v + '*' })).then(() => {
				return resolve({ error: 0, mensaje: "" })
			})
		})
	},
	_obtenerHTML: (link) => {

		return new Promise((resolve, reject) => {
			// console.log(link)
			request({
				timeout: 20000,
				url: link,
				headers: {
					'Content-type': 'content=text/html; charset=latin1'
				},
				encoding: 'binary'
			}, (error, response, body) => {
				if (error || response === undefined) return resolve(error)

				return resolve(body)

			})
		})

	},
	_obtenerCartelera: (body) => {

		let $ = cheerio.load(body, { decodeEntities: false })

		let tablas = $('div[class*=CajaSombraCont]').last().children('table').toArray()

		let ar = []

		return tablas.reduce((acc, tabla) => {

			if ($(tabla).find('a').text() !== "Mapa") {

				ar.push({
					error: 0,
					mensaje: "",
					data: {
						titulo: $(tabla).find('a').text(),
						imagen: { original: $(tabla).find('img').attr('src') },
						texto: $(tabla).find('div').last().text().replace(';', ''),
						href: $(tabla).find('a').attr('href')
					}
				})

			} else {

				ar.push({
					error: 400,
					mensaje: "pagina con mapa",
					data: ""
				})

			}

			return ar

		}, Promise.resolve(ar))

	},
	_obtenerFicha: (body) => {

		return new Promise((resolve, reject) => {
			let $ = cheerio.load(body, { decodeEntities: false })
			let tablas = $('#FichaPeliculaDatos').first()
			let _ar = {}
			if (tablas.find('a').text() === "Mapa") {
				ar = {
					error: 400,
					mensaje: "pagina con mapa",
					data: ""
				}
			} else {

				let _f = tablas.find('div.FichaAntigua').first().text().match(/\ ([0-9].*)?\ \min/)
				let _h, _m, tiempo
				if (_f == undefined) {
					tiempo = ""
				} else {
					_h = Math.floor(_f[1] / 60),
						_m = Math.floor(_f[1] % 60)

					_h = _h > 9 ? "" + _h : "0" + _h
					_m = _m > 9 ? "" + _m : "0" + _m

					tiempo = _h + ':' + _m
				}

				let _f_real = tablas.find('div.FichaAntigua').eq(2).text().match(/\:\ (\w.*)/)[1]
				let _f_parseada = _f_real.match(/([0-9].*)?\ de\ ([a-z].*)? de ([0-9].*)?/)
				let _f_2 = 0;
				switch (_f_parseada[2].toLowerCase()) {
					case 'enero':
						_f_2 = 01;
						break;
					case 'febrero':
						_f_2 = 02;
						break;
					case 'marzo':
						_f_2 = 03;
						break;
					case 'abril':
						_f_2 = 04;
						break;
					case 'mayo':
						_f_2 = 05;
						break;
					case 'junio':
						_f_2 = 06;
						break;
					case 'julio':
						_f_2 = 07;
						break;
					case 'agosto':
						_f_2 = 08;
						break;
					case 'septiembre':
						_f_2 = 09;
						break;
					case 'octubre':
						_f_2 = 10;
						break;
					case 'noviembre':
						_f_2 = 11;
						break;
					case 'diciembre':
						_f_2 = 12;
						break;
				}
				let largo = tablas.find('div#TextoDetalladoLargo > div > div')
				_ar = {
					error: 0,
					mensaje: "",
					data: {
						fichaAntigua: tablas.find('div#TextoDetalladoLargo > div').first().text(),
						video: tablas.find('iframe').first().attr('src'),
						nombreIngles: $("div.FichaAntigua").first().text(),
						tiempo: tiempo,
						genero: '',
						estreno: moment(`${_f_parseada[3]}-${_f_2}-${_f_parseada[1]}`, 'YYYY-MM-DD'),
						texto: tablas.find('div#TextoDetalladoLargo > div').first().text(),
						director: largo.eq(0).text().replace(/'/g, "").replace(/"/g, "").replace("Director: ", ""),
						elenco: largo.eq(1).text().replace(/'/g, "").replace(/"/g, "").replace("Elenco Principal: ", ""),
						guion: largo.eq(2).text().replace(/'/g, "").replace(/"/g, "").replace("Guión: ", ""),
						musica: largo.eq(3).text().replace(/'/g, "").replace(/"/g, "").replace("Música: ", "")
					}
				}
			}

			return resolve(_ar)
		})
	},
	_obtenerGenero: (body) => {
		return new Promise((resolve, reject) => {
			$ = cheerio.load(body, { decodeEntities: false })
			resolve($.text())
		})
	},
	_obtenerImagen: (link) => {

		return new Promise((resolve, reject) => {
			let imgNombre = `${config.carpetas[0]}${(Math.random() * 1e64).toString(36)}.${link.split(".").pop()}`;
			image_downloader({
				url: link,
				dest: imgNombre,
				done: (err, filename, image) => {

					if (err) {
						resolve({
							error: 500,
							mensaje: "No se logro descargar la imagen",
							data: err
						})
					} else {
						resolve({
							error: 0,
							mensaje: "",
							data: filename.replace(process.cwd() + '/public','')
						})
					}

				}
			});
		})

	},
	_obtenerColorPredominante: (localUrl) => {
		return new Promise((resolve, reject) => {

			let v = new vibrant(process.cwd() + '/public' + localUrl)

			v.getPalette((e, s) => {
				if (e) {
					return resolve({
						error: 500,
						mensaje: "Error al obtener el color predominante",
						data: e
					})
				} else {
					let tmp = {
						Vibrant: "",
						LightMuted: "",
						LightVibrant: "",
						DarkMuted: "",
						DarkVibrant: ""
					}
					if (s["Vibrant"] != null)
						tmp.Vibrant = s["Vibrant"]._rgb

					if (s["LightMuted"] != null)
						tmp.LightMuted = s["LightMuted"]._rgb

					if (s["LightVibrant"] != null)
						tmp.LightVibrant = s["LightVibrant"]._rgb

					if (s["DarkMuted"] != null)
						tmp.DarkMuted = s["DarkMuted"]._rgb

					if (s["DarkVibrant"] != null)
						tmp.DarkVibrant = s["DarkVibrant"]._rgb

					return resolve({
						error: 0,
						mensaje: "",
						data: tmp
					})
				}

			})

		})
	},
	_guardarJson: () => {
		return new Promise((Resolve,Reject) => {
			fs.writeFile(config.jsonFile, JSON.stringify(self.peliculas, null, 4), 'utf8', (err) => {
				if(err) Reject({error: 500, mensaje: "guardado de json", data: err})

				console.log(`Archivo guardado => ${config.jsonFile}`)

				Resolve({error: 0, mensaje: "", data: ""})
			
			})
		})
	}
}

module.exports = self