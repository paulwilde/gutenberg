/**
 * External dependencies
 */
import { combineReducers, createStore } from 'redux';
import { keyBy, last, omit, without } from 'lodash';

/**
 * Internal dependencies
 */
import { combineUndoableReducers } from 'utils/undoable-reducer';

/**
 * Undoable reducer returning the editor post state, including blocks parsed
 * from current HTML markup.
 *
 * Handles the following state keys:
 *  - post: an object describing the current post, in the format used by the WP
 *  REST API
 *  - blocksByUid: post content blocks keyed by UID
 *  - blockOrder: list of block UIDs in order
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export const editor = combineUndoableReducers( {
	post( state = {}, action ) {
		switch ( action.type ) {
			case 'EDIT_POST':
				return action.post || state;

			case 'POST_UPDATE_REQUEST_SUCCESS':
				return action.post;
		}

		return state;
	},

	blocksByUid( state = {}, action ) {
		switch ( action.type ) {
			case 'EDIT_POST':
				return keyBy( action.blockNodes, 'uid' );

			case 'UPDATE_BLOCK':
				return {
					...state,
					[ action.uid ]: {
						...state[ action.uid ],
						...action.updates
					}
				};

			case 'INSERT_BLOCK':
				return {
					...state,
					[ action.block.uid ]: action.block
				};

			case 'SWITCH_BLOCK_TYPE':
				return {
					...state,
					[ action.uid ]: action.block
				};

			case 'REMOVE_BLOCK':
				return omit( state, action.uid );
		}

		return state;
	},

	blockOrder( state = [], action ) {
		let index;
		let swappedUid;
		switch ( action.type ) {
			case 'EDIT_POST':
				return action.blockNodes.map( ( { uid } ) => uid );

			case 'INSERT_BLOCK':
				const position = action.after ? state.indexOf( action.after ) + 1 : state.length;
				return [
					...state.slice( 0, position ),
					action.block.uid,
					...state.slice( position )
				];

			case 'MOVE_BLOCK_UP':
				if ( action.uid === state[ 0 ] ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index - 1 ];
				return [
					...state.slice( 0, index - 1 ),
					action.uid,
					swappedUid,
					...state.slice( index + 1 )
				];

			case 'MOVE_BLOCK_DOWN':
				if ( action.uid === last( state ) ) {
					return state;
				}
				index = state.indexOf( action.uid );
				swappedUid = state[ index + 1 ];
				return [
					...state.slice( 0, index ),
					swappedUid,
					action.uid,
					...state.slice( index + 2 )
				];

			case 'REMOVE_BLOCK':
				return without( state, action.uid );
		}

		return state;
	}
}, { resetTypes: [ 'EDIT_POST' ] } );

/**
 * Reducer returning selected block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function selectedBlock( state = {}, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_SELECTED':
			if ( ! action.selected ) {
				return state.uid === action.uid ? {} : state;
			}
			return action.uid === state.uid
				? state
				: { uid: action.uid, typing: false, focus: {} };

		case 'MOVE_BLOCK_UP':
		case 'MOVE_BLOCK_DOWN':
			return action.uid === state.uid
				? state
				: { uid: action.uid, typing: false, focus: {} };

		case 'INSERT_BLOCK':
			return {
				uid: action.block.uid,
				typing: false,
				focus: {}
			};

		case 'UPDATE_FOCUS':
			return {
				uid: action.uid,
				typing: state.uid === action.uid ? state.typing : false,
				focus: action.config || {}
			};

		case 'START_TYPING':
			if ( action.uid !== state.uid ) {
				return {
					uid: action.uid,
					typing: true,
					focus: {}
				};
			}

			return {
				...state,
				typing: true
			};
	}

	return state;
}

/**
 * Reducer returning hovered block state.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
export function hoveredBlock( state = null, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_HOVERED':
			return action.hovered ? action.uid : null;

		case 'TOGGLE_BLOCK_SELECTED':
			if ( action.selected ) {
				return null;
			}
			break;
		case 'START_TYPING':
			return null;
	}

	return state;
}

/**
 * Reducer returning current editor mode, either "visual" or "text".
 *
 * @param  {string} state  Current state
 * @param  {Object} action Dispatched action
 * @return {string}        Updated state
 */
export function mode( state = 'visual', action ) {
	switch ( action.type ) {
		case 'SWITCH_MODE':
			return action.mode;
	}

	return state;
}

export function isSidebarOpened( state = false, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SIDEBAR':
			return ! state;
	}

	return state;
}

/**
 * Reducer returning current network request state (whether a request to the WP
 * REST API is in progress, successful, or failed).
 *
 * @param  {string} state  Current state
 * @param  {Object} action Dispatched action
 * @return {string}        Updated state
 */
export function api( state = {}, action ) {
	switch ( action.type ) {
		case 'POST_UPDATE_REQUEST':
			return {
				requesting: true,
				successful: false,
				error: null,
				isNew: action.isNew,
			};

		case 'POST_UPDATE_REQUEST_SUCCESS':
			return {
				requesting: false,
				successful: true,
				error: null,
				isNew: action.isNew,
			};

		case 'POST_UPDATE_REQUEST_FAILURE':
			return {
				requesting: false,
				successful: true,
				error: action.error,
				isNew: action.isNew,
			};
	}

	return state;
}

/**
 * Creates a new instance of a Redux store.
 *
 * @return {Redux.Store} Redux store
 */
export function createReduxStore() {
	const reducer = combineReducers( {
		editor,
		selectedBlock,
		hoveredBlock,
		mode,
		isSidebarOpened,
		api,
	} );

	return createStore(
		reducer,
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	);
}

export default createReduxStore;
