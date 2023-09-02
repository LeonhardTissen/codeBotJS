const GIFEncoder = require("gifencoder");
const fs = require("fs");
const { AttachmentBuilder } = require("discord.js");

function sendImages(out_images, channel, gif_speed) {
	// If there is one image attached, send it as a .png
	if (out_images.length === 1) {
		channel.send({ 
			files: [
				new AttachmentBuilder(out_images[0].toBuffer(), {name: 'image.png'})
			] 
		});
	}
	// If there is more than one ctx attached, send it as a .gif using GIFEncoder
	else if (out_images.length >= 2) {
		const encoder = new GIFEncoder(out_images[0].width, out_images[0].height);
		const gifStream = fs.createWriteStream('animated.gif');

		encoder.createReadStream().pipe(gifStream);
		encoder.start();
		encoder.setRepeat(0);
		encoder.setDelay(gif_speed);

		out_images.forEach(async (cvs, i) => {
			encoder.addFrame(cvs.getContext('2d'));

			if (i === out_images.length - 1) {
				encoder.finish();
				setTimeout(() => {
					channel.send({
						files: [
							{
								attachment: 'animated.gif',
								name: 'animated.gif'
							}
						]
					});
				}, 1000)
			}
		});
	}
}
exports.sendImages = sendImages;
