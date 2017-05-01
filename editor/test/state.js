/**
 * External dependencies
 */
import { expect } from 'chai';
import { values } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	editor,
	hoveredBlock,
	selectedBlock,
	mode,
	isSidebarOpened,
	createReduxStore
} from '../state';

describe( 'state', () => {
	describe( 'editor()', () => {
		before( () => {
			wp.blocks.registerBlock( 'core/test-block', {} );
		} );

		after( () => {
			wp.blocks.unregisterBlock( 'core/test-block' );
		} );

		it( 'should return empty blocksByUid, blockOrder, history by default', () => {
			const state = editor( undefined, {} );

			expect( state.blocksByUid ).to.eql( {} );
			expect( state.blockOrder ).to.eql( [] );
			expect( state ).to.have.keys( 'history' );
		} );

		it( 'should key by replaced blocks uid', () => {
			const original = editor( undefined, {} );
			const state = editor( original, {
				type: 'EDIT_POST',
				blockNodes: [ { uid: 'bananas' } ]
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 1 );
			expect( values( state.blocksByUid )[ 0 ].uid ).to.equal( 'bananas' );
			expect( state.blockOrder ).to.eql( [ 'bananas' ] );
		} );

		it( 'should return with block updates', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'kumquat',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'UPDATE_BLOCK',
				uid: 'kumquat',
				updates: {
					attributes: {
						updated: true
					}
				}
			} );

			expect( state.blocksByUid.kumquat.attributes.updated ).to.be.true();
		} );

		it( 'should insert block', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform'
				}
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 2 );
			expect( values( state.blocksByUid )[ 1 ].uid ).to.equal( 'ribs' );
			expect( state.blockOrder ).to.eql( [ 'chicken', 'ribs' ] );
		} );

		it( 'should switch the block', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'SWITCH_BLOCK_TYPE',
				uid: 'chicken',
				block: {
					uid: 'chicken',
					blockType: 'core/freeform'
				}
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 1 );
			expect( values( state.blocksByUid )[ 0 ].blockType ).to.equal( 'core/freeform' );
		} );

		it( 'should move the block up', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the first block up', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'chicken'
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should move the block down', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken'
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs', 'chicken' ] );
		} );

		it( 'should not move the last block down', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'ribs'
			} );

			expect( state.blockOrder ).to.equal( original.blockOrder );
		} );

		it( 'should remove the block', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'chicken',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );
			const state = editor( original, {
				type: 'REMOVE_BLOCK',
				uid: 'chicken'
			} );

			expect( state.blockOrder ).to.eql( [ 'ribs' ] );
			expect( state.blocksByUid ).to.eql( {
				ribs: {
					uid: 'ribs',
					blockType: 'core/test-block',
					attributes: {}
				}
			} );
		} );
	} );

	describe( 'hoveredBlock()', () => {
		it( 'should return with block uid as hovered', () => {
			const state = hoveredBlock( null, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true
			} );

			expect( state ).to.equal( 'kumquat' );
		} );

		it( 'should return null when a block is selected', () => {
			const state = hoveredBlock( 'kumquat', {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state ).to.be.null();
		} );
	} );

	describe( 'selectedBlock()', () => {
		it( 'should return with block uid as selected', () => {
			const state = selectedBlock( undefined, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state ).to.eql( { uid: 'kumquat', typing: false, focus: {} } );
		} );

		it( 'should not update the state if already selected', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: true
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should unselect the block if currently selected', () => {
			const original = deepFreeze( { uid: 'kumquat', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: false
			} );

			expect( state ).to.eql( {} );
		} );

		it( 'should not unselect the block if another block is selected', () => {
			const original = deepFreeze( { uid: 'loquat', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'TOGGLE_BLOCK_SELECTED',
				uid: 'kumquat',
				selected: false
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should return with inserted block', () => {
			const state = selectedBlock( undefined, {
				type: 'INSERT_BLOCK',
				block: {
					uid: 'ribs',
					blockType: 'core/freeform'
				}
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved up', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: false, focus: {} } );
		} );

		it( 'should return with block moved down', () => {
			const state = selectedBlock( undefined, {
				type: 'MOVE_BLOCK_DOWN',
				uid: 'chicken'
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: {} } );
		} );

		it( 'should not update the state if the block moved is already selected', () => {
			const original = deepFreeze( { uid: 'ribs', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'MOVE_BLOCK_UP',
				uid: 'ribs'
			} );

			expect( state ).to.equal( original );
		} );

		it( 'should update the focus and selects the block', () => {
			const state = selectedBlock( undefined, {
				type: 'UPDATE_FOCUS',
				uid: 'chicken',
				config: { editable: 'citation' }
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: false, focus: { editable: 'citation' } } );
		} );

		it( 'should update the focus and merge the existing state', () => {
			const original = deepFreeze( { uid: 'ribs', typing: true, focus: {} } );
			const state = selectedBlock( original, {
				type: 'UPDATE_FOCUS',
				uid: 'ribs',
				config: { editable: 'citation' }
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: true, focus: { editable: 'citation' } } );
		} );

		it( 'should set the typing flag and selects the block', () => {
			const state = selectedBlock( undefined, {
				type: 'START_TYPING',
				uid: 'chicken'
			} );

			expect( state ).to.eql( { uid: 'chicken', typing: true, focus: {} } );
		} );

		it( 'should set the typing flag and merge the existing state', () => {
			const original = deepFreeze( { uid: 'ribs', typing: false, focus: { editable: 'citation' } } );
			const state = selectedBlock( original, {
				type: 'START_TYPING',
				uid: 'ribs'
			} );

			expect( state ).to.eql( { uid: 'ribs', typing: true, focus: { editable: 'citation' } } );
		} );

		it( 'should insert after the specified block uid', () => {
			const original = editor( undefined, {
				type: 'EDIT_POST',
				blockNodes: [ {
					uid: 'kumquat',
					blockType: 'core/test-block',
					attributes: {}
				}, {
					uid: 'loquat',
					blockType: 'core/test-block',
					attributes: {}
				} ]
			} );

			const state = editor( original, {
				type: 'INSERT_BLOCK',
				after: 'kumquat',
				block: {
					uid: 'persimmon',
					blockType: 'core/freeform'
				}
			} );

			expect( Object.keys( state.blocksByUid ) ).to.have.lengthOf( 3 );
			expect( state.blockOrder ).to.eql( [ 'kumquat', 'persimmon', 'loquat' ] );
		} );
	} );

	describe( 'mode()', () => {
		it( 'should return "visual" by default', () => {
			const state = mode( undefined, {} );

			expect( state ).to.equal( 'visual' );
		} );

		it( 'should return switched mode', () => {
			const state = mode( null, {
				type: 'SWITCH_MODE',
				mode: 'text'
			} );

			expect( state ).to.equal( 'text' );
		} );
	} );

	describe( 'isSidebarOpened()', () => {
		it( 'should be closed by default', () => {
			const state = isSidebarOpened( undefined, {} );

			expect( state ).to.be.false();
		} );

		it( 'should toggle the sidebar open flag', () => {
			const state = isSidebarOpened( false, {
				type: 'TOGGLE_SIDEBAR'
			} );

			expect( state ).to.be.true();
		} );
	} );

	describe( 'createReduxStore()', () => {
		it( 'should return a redux store', () => {
			const store = createReduxStore();

			expect( store.dispatch ).to.be.a( 'function' );
			expect( store.getState ).to.be.a( 'function' );
		} );

		it( 'should have expected reducer keys', () => {
			const store = createReduxStore();
			const state = store.getState();

			expect( Object.keys( state ) ).to.have.members( [
				'editor',
				'selectedBlock',
				'hoveredBlock',
				'mode',
				'isSidebarOpened'
			] );
		} );
	} );
} );
