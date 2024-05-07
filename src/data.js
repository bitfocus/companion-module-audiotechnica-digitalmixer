module.exports = {
	initData() {
        let model = this.MODELS.find((model) => model.id == this.config.model);

		this.DATA.operator_page = [];
		for (let i = 1; i <= 8; i++) {
			let obj = {};
			for (let j = 1; j <=8; j++) {
				obj[`fader_${j}_level`] = 0;
				obj[`fader_${j}_mute`] = false;
			}
			this.DATA.operator_page.push(obj);
		}

		if (model.data_request.includes('input_channel_settings')) {
			this.DATA.input_channel_settings = [];
		}

		if (model.data_request.includes('subinput_channel_settings')) {
			this.DATA.sub_input_channel_settings = [];
		}

		if (model.data_request.includes('input_gain_level')) {
			this.DATA.input_gain_levels = [];
		}

		if (model.data_request.includes('output_channel_settings')) {
			this.DATA.output_channel_settings = [];
		}

		if (model.data_request.includes('output_level')) {
			this.DATA.output_levels = [];
		}

		if (model.data_request.includes('output_mute')) {
			this.DATA.output_mutes = [];
		}

		if (model.data_request.includes('level_meter')) {
			this.DATA.meter_levels = [];
		}

		this.DATA.open_channels = [];
    }
};