const Game = artifacts.require('Game');

contract('Game', accounts => {


  describe('initialisation', () => {
    it('should not be able to create a game with units greater than the field size', async () => {
      await Game.new('asdf', 2, 5, 1000)
        .catch(e => expect(e).to.not.be.null);
    });
  });

  describe('game', () => {
    let instance = null;

    beforeEach(async () => {
      instance = await Game.new('asdf', 2, 5, 10000);
    });

    

  });
  
});