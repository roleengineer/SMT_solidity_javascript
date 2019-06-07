const SparseMerkleTree = artifacts.require("SparseMerkleTree");

module.exports = function(deployer) {
  deployer.deploy(SparseMerkleTree);
};
