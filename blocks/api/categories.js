/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Block categories.
 *
 * Group blocks together based on common traits
 * The block "inserter" relies on these to present the list blocks
 *
 * @var {Array} categories
 */
const categories = {};

/**
 * Registers a new block category provided a unique slug and an object defining its
 * behavior. Once registered, the category is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param  {string}   name     Category name
 * @param  {string}   settings Category settings
 * @return {object}          The category, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
export function registerCategory( name, settings ) {
	if ( typeof name !== 'string' ) {
		console.error(
			'Category names must be strings.'
		);
		return;
	}
	if ( categories[ name ] ) {
		console.error(
			'Category "' + name + '" is already registered.'
		);
		return;
	}
	const category = Object.assign( { name }, settings );
	categories[ name ] = category;
	return category;
}

/**
 * Unregisters a block category.
 *
 * @param  {string}   name Category name
 * @return {object}        The previous category value, if it has been
 *                         successfully unregistered; otherwise `undefined`.
 */
export function unregisterCategory( name ) {
	if ( ! categories[ name ] ) {
		console.error(
			'Block category "' + name + '" is not registered.'
		);
		return;
	}
	const oldCategory = categories[ name ];
	delete categories[ name ];
	return oldCategory;
}

/**
 * Returns a registered block category.
 *
 * @param  {string}  name Category name
 * @return {?Object}      Category
 */
export function getCategory( name ) {
	return categories[ name ];
}

/**
 * Returns all the block categories.
 *
 * @return {Array} Block categories
 */
export function getCategories() {
	return categories;
}

registerCategory( 'common', { title: __( 'Common Blocks' ) } );
registerCategory( 'formatting', { title: __( 'Formatting' ) } );
registerCategory( 'layout', { title: __( 'Layout Blocks' ) } );
registerCategory( 'widgets', { title: __( 'Widgets' ) } );
registerCategory( 'embed', { title: __( 'Embed' ) } );
