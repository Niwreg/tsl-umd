/*
Copyright (c) 2016, William Viker <william.viker@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

var debug        = require("debug")("tsl-umd");
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var dgram        = require('dgram');
var packet       = require('packet');


function tslumd(port,umdtslv) {

	var self = this;

	self.port = port;
	if (typeof umdtslv !== "undefined") { //check if argument is passed
        	self.umdtslv = umdtslv;
    	} else {
		self.umdtslv = v4;
	}
	
	self.parser = packet.createParser();
	self.server = dgram.createSocket('udp4');
	self.parser.packet('tsl', 'b8{x1, b7 => address},b8{x2, b2 => brightness, b1 => tally4, b1 => tally3, b1 => tally2, b1 => tally1 }, b8[16] => label');
	self.parser.packet('tslv5', 'l16 => pbc, l8 => version, l8{b1 => stringtype, b1 => scontrol, x6}, l16 => screen, l16 => index, l16{b2 => RHTally, b2 => TXTTally, b2 => LHTally,b2=>brightness,x6,b1 =>controldata}, l16/l8 => label');

	self.server.on('error', (err) => {
		debug('error',err);
		throw err;
		self.server.close();
	});

	self.server.on('message', (msg, rinfo) => {
		if (self.umdtslv != 'v5') {
			self.parser.extract("tsl", function (res) {
				res.label = new Buffer(res.label).toString();
				res.sender = rinfo.address;
				self.emit('message', res);
			});
			self.parser.parse(msg);
		} elseif (self.umdtslv == 'v5') {
			self.parser.extract("tslv5", function (res) {
				res.label = new Buffer(res.label).toString();
				res.sender = rinfo.address;
				self.emit('message', res);
			});
			self.parser.parse(msg);
		}
			
	});

	self.server.on('listening', () => {
		var address = self.server.address();
		console.log(`server listening ${address.address}:${address.port}`);
	});

	self.server.bind(self.port);

}

util.inherits(tslumd, EventEmitter);

exports = module.exports = tslumd;
