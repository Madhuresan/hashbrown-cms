'use strict';

let fs = require('fs');

let config = null;

class SecurityHelper {
	/**
	 * Gets the SSL config
  	 *
	 * @returns {Object} Config
	 */
	static getConfig() {
		if(config) { return config; }

        let sslConfigPath = appRoot + '/config/ssl.cfg';
        
        if(!fs.existsSync(sslConfigPath)) { return null; }

        config = JSON.parse(fs.readFileSync(sslConfigPath)); 

        // Config sanity check
        if(!config.domain) {
			config = null;

            throw new Error('Variable "domain" not set in /config/ssl.cfg');
        }
        
        if(!config.email) {
			config = null;

            throw new Error('Variable "email" not set in /config/ssl.cfg');
        }

		return config;
	}

    /**
     * Gets the security credentials
     *
     * @returns {Object} Credentials
     */
    static getCredentials() {
		let config = this.getConfig();

		return {
			key: fs.readFileSync(appRoot + '/certs/live/' + config.domain + '/privkey.pem'),
			cert: fs.readFileSync(appRoot + '/certs/live/' + config.domain + '/fullchain.pem'),
			ca: fs.readFileSync(appRoot + '/certs/live/' + config.domain + '/chain.pem')
		};
    }

	/**
	 * Checks whether we're running HTTPS
     *
     * @returns {Boolean} True if config was found
     */
    static isHTTPS() {
		return this.getConfig() != null;
	}

    /**
     * Starts the letsencrypt handler
     *
     * @returns {Object} Let's encrypt handler
     */
    static startLetsEncrypt() {
		let config = this.getConfig();       
 
        // Storage backend
        let leStore = require('le-store-certbot').create({
            configDir: appRoot + '/certs',
            debug: true
        });

        // ACME challenge handler
        let leChallenge = require('le-challenge-fs').create({
            webrootPath: '/',
            debug: true
        });

        // Agreement handler
        let leAgree = (opts, agreeCb) => {
            agreeCb(null, opts.tosUrl);
        };

        // Let's Encrypt instance
        let LE = require('greenlock');
        let le = LE.create({
            server: LE.productionServerUrl,
            store: leStore,
            challenges: { 'http-01': leChallenge },
            challengeType: 'http-01',
            agreeToTerms: leAgree,
            debug: false
        });

        // Check in-memory cache of certificates for the named domain
        return le.check({
            domains: [config.domain]
        }).then((results) => {
            // We already  have certificates
            if(results) { return; }
            
            le.register({
                domains: [config.domain],
                email: config.email,
                agreeTos: true,
                rsaKeySize: 2048,
                challengeType: 'http-01'
            })
            .then(
                (certs) => {
					return Promise.resolve(le);
                },
                (err) => {
                    throw err;
                }
            );
        });
    }
}

module.exports = SecurityHelper;
