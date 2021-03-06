// # Configuration API
// RESTful API for browsing the configuration
var Promise = require('bluebird'),
    _ = require('lodash'),
    urlService = require('../services/url'),
    models = require('../models'),
    config = require('../config'),
    settingsCache = require('../services/settings/cache'),
    ghostVersion = require('../lib/ghost-version'),
    configuration;

function fetchAvailableTimezones() {
    var timezones = require('../data/timezones.json');
    return timezones;
}

function getAboutConfig() {
    return {
        version: ghostVersion.full,
        environment: config.get('env'),
        database: config.get('database').client,
        mail: _.isObject(config.get('mail')) ? config.get('mail').transport : ''
    };
}

function getBaseConfig() {
    return {
        useGravatar: !config.isPrivacyDisabled('useGravatar'),
        publicAPI: config.get('publicAPI') === true,
        blogUrl: urlService.utils.urlFor('home', true),
        blogTitle: settingsCache.get('title'),
        clientExtensions: config.get('clientExtensions'),
        enableDeveloperExperiments: config.get('enableDeveloperExperiments')
    };
}

/**
 * ## Configuration API Methods
 *
 * We need to load the client credentials dynamically.
 *
 * **See:** [API Methods](constants.js.html#api%20methods)
 */
configuration = {

    /**
     * Always returns {configuration: []}
     * Sometimes the array contains configuration items
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    read: function read(options) {
        options = options || {};

        if (!options.key) {
            return models.Client.findOne({slug: 'ghost-admin'})
                .then(function (ghostAdmin) {
                    var configuration = getBaseConfig();

                    configuration.clientId = ghostAdmin.get('slug');
                    configuration.clientSecret = ghostAdmin.get('secret');

                    return {configuration: [configuration]};
                });
        }

        if (options.key === 'about') {
            return Promise.resolve({configuration: [getAboutConfig()]});
        }

        // Timezone endpoint
        if (options.key === 'timezones') {
            return Promise.resolve({configuration: [fetchAvailableTimezones()]});
        }

        return Promise.resolve({configuration: []});
    }
};

module.exports = configuration;
