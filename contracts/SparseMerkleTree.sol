pragma solidity >=0.4.21 <0.6.0;


// Based on https://rinkeby.etherscan.io/address/0x881544e0b2e02a79ad10b01eca51660889d5452b#code
// Original Code for the sparse merkle tree came from Wolkdb Plasma, this is now no longer compatible with that
// we have javascript and Golang implementations for reference of the new implementation.
contract SparseMerkleTree {

  uint8 constant DEPTH = 160;
  bytes32[DEPTH + 1] public defaultHashes;
  bytes32 public root;

  constructor() public {
    // defaultHash[0] is being set to keccak256(uint256(0));
    defaultHashes[0] = 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563;
    for (uint8 i = 1; i <= DEPTH; i ++) {
      defaultHashes[i] = keccak256(abi.encodePacked(defaultHashes[i-1], defaultHashes[i-1]));
    }
    root = defaultHashes[DEPTH];
  }

  function read(uint160 key, bytes32 leaf, bytes memory proof) public view returns (bool) {
    bytes32 calculatedRoot = getRoot(leaf, key, proof);
    return (calculatedRoot == root);
  }

  function write(uint160 key, bytes32 prevLeaf, bytes memory proof, bytes32 newLeaf) public {
    bytes32 calculatedRoot = getRoot(prevLeaf, key, proof);
    require(calculatedRoot == root, "update proof not valid");
    root = getRoot(newLeaf, key, proof);
  }

  function del(uint160 key, bytes32 prevLeaf, bytes memory proof) public {
    bytes32 calculatedRoot = getRoot(prevLeaf, key, proof);
    require(calculatedRoot == root, "update proof not valid");
    root = getRoot(defaultHashes[0], key, proof);
  }

  // first 160 bits of the proof are the 0/1 bits
  function getRoot(bytes32 leaf, uint160 _index, bytes memory proof) public view returns (bytes32) {
    require((proof.length - 20) % 32 == 0 && proof.length <= 5140, "invalid proof format");
    bytes32 proofElement;
    bytes32 computedHash = leaf;
    uint16 p = 20;
    uint160 proofBits;
    uint160 index = _index;
    assembly {proofBits := div(mload(add(proof, 32)), exp(256, 12))}

    for (uint d = 0; d < DEPTH; d++ ) {
      if (proofBits % 2 == 0) { // check if last bit of proofBits is 0
        proofElement = defaultHashes[d];
      } else {
        p += 32;
        require(proof.length >= p, "proof not long enough");
        assembly { proofElement := mload(add(proof, p)) }
      }
      if (index % 2 == 0) {
        computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
      } else {
        computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
      }
      proofBits = proofBits / 2; // shift it right for next bit
      index = index / 2;
    }
    return computedHash;
  }
}
