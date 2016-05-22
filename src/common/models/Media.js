'use strict';

let crypto = require('crypto');

let MediaHelper = require('../../server/helpers/MediaHelper');

/**
 * The base class for all Media objects
 */
class Media {
    /**
     * Creates a new Media object
     *
     * @param {Object} file
     *
     * @return {Media} media
     */
    static create(file) {
        let content = Content.create({});

        let media = new Media(content.properties);
    
        media.properties.id = crypto.randomBytes(20).toString('hex');
        media.uploadPromise = MediaHelper.setMediaData(media.propeties.id, file);

        return media;
    }
}

module.exports = Media;
