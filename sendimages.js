const GIFEncoder = require("gifencoder");
const fs = require("fs");
const { AttachmentBuilder } = require("discord.js");

function sendImages(out_images, channel, gif_speed) {
	const uuid = Math.random().toString(36).substring(7);

	console.log(`Generated ${out_images.length} images`);
	
	// If there is one image attached, send it as a .png
	if (out_images.length === 1) {
		channel.send({ 
			files: [
				new AttachmentBuilder(out_images[0].toBuffer(), {name: `image_${uuid}.png`})
			] 
		});
	}
	// If there is more than one ctx attached, send it as a .gif using GIFEncoder
	else if (out_images.length >= 2) {
		const encoder = new GIFEncoder(out_images[0].width, out_images[0].height);
		const gifStream = fs.createWriteStream(`animated_${uuid}.gif`);

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
								attachment: `animated_${uuid}.gif`,
								name: `animated_${uuid}.gif`
							}
						]
					});
				}, 1000)
			}
		});
	}
}
exports.sendImages = sendImages;
