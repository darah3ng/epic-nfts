// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import 'hardhat/console.sol';

import { Base64 } from "./libraries/Base64.sol";

contract MyEpicNFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  // Split the SVG at the part where it asks for background color
  string svgPartOne = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 24px; }</style><rect width='100%' height='100%' fill='";
  string svgPartTwo = "'/><text x='50%' y='50%' class='base' dominant-baseline='middle' text-anchor='middle'>";
  
  string[] firstWords = ['Jiraiya', 'Naruto', 'Hinata', 'Sasuke', 'Saitama', 'Goku', 'Sung Jinwoo', 'Eren', 'Kakashi', 'Batman', 'Ironman', 'Tobey', 'Davion', 'Minato', 'Mikasa', 'Rock Lee', 'Jon', 'Mirana'];
  string[] secondWords = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
  // string[] thirdWords = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'];
  string[] thirdWords = [unicode"😉", unicode"🔥", unicode"✨", unicode"🔪", unicode"🧨", unicode"🥷", unicode"🥇", unicode"🗿", unicode"⚔️", unicode"🐺", unicode"💦", unicode"🍀", unicode"🌈", unicode"💯", unicode"🚒", unicode"🥈", unicode"🗡️", unicode"👑"];
  string[] colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
		  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
    
  int256 public mintedNumber = 0;
  int256 public maxMintedNumber = 50;
  address public owner;

  event NewEpicNFTMinted(address sender, uint256 tokenId);

  constructor() ERC721 ("SquareNFT", "SQUARE") {
    console.log('This is my NFT contract. Woah!');
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  modifier validAddress(address _addr) {
    // Address passed in is not the zero address.
    require(_addr != address(0), "Not valid address");
    _;
  }

  function changeOwner(address _newOwner) public onlyOwner validAddress(_newOwner) {
    owner = _newOwner;
  }

  function random(string memory _input) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked(_input)));
  }

  function randomItems(string[] memory _items, string memory _word, uint256 _tokenId) public pure returns (string memory) {
    uint256 rand = random(string(abi.encodePacked(_word, Strings.toString(_tokenId))));
    rand = rand % _items.length;
    return _items[rand];
  }

  function pickRandomFirstWord(uint256 _tokenId) public view returns (string memory) {
    return randomItems(firstWords, "FIRST_WORD", _tokenId);
  }

  function pickRandomSecondWord(uint256 _tokenId) public view returns (string memory) {
    return randomItems(secondWords, "SECOND_WORD", _tokenId);
  }

  function pickRandomThirdWord(uint256 _tokenId) public view returns (string memory) {
    return randomItems(thirdWords, "THIRD_WORD", _tokenId);
  }

  function pickRandomColor(uint256 _tokenId) public view returns (string memory) {
    return randomItems(colors, "COLOR", _tokenId);
  }

  function getTotalMaxMintedNumber() public view returns (int256) {
    return maxMintedNumber;
  }

  function getMintedNumber() public view returns (int256) {
      return mintedNumber;
  }

  function changeMaxMintedNumber(int256 _number) public onlyOwner {
    require(_number > maxMintedNumber, "Number needs to be higher than the current max minted number.");
    maxMintedNumber = _number;
  }

  function makeAnEpicNFT() public {
    require(mintedNumber < maxMintedNumber, "The total minted amount has been exceeded.");
    
    uint256 newItemId = _tokenIds.current();

    string memory first = pickRandomFirstWord(newItemId);
    string memory second = pickRandomSecondWord(newItemId);
    string memory third = pickRandomThirdWord(newItemId);
    string memory combinedWord = string(abi.encodePacked(first, ' ', second, third));
    string memory name = string(abi.encodePacked(first, ' ', second));

    string memory randomColor = pickRandomColor(newItemId);
    string memory finalSvg = string(abi.encodePacked(svgPartOne, randomColor, svgPartTwo, combinedWord, "</text></svg>"));

    // Get all the JSON metadata in place and base64 encode it.
    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            // We set the title of our NFT as the generated word.
            name,
            '", "description": "A highly acclaimed collection of squares.", "image": "data:image/svg+xml;base64,',
            // We add data:image/svg+xml;base64 and then append our base64 encode our svg.
            Base64.encode(bytes(finalSvg)),
            '"}'
          )
        )
      )
    );

    // we prepend data:application/json;base64, to our data.
    string memory finalTokenUri = string(
      abi.encodePacked("data:application/json;base64,", json)
    );

    console.log("\n--------------------");
    console.log(
      string(
        abi.encodePacked(
          "https://nftpreview.0xdev.codes/?code=",
          finalTokenUri
        )
      )
    );
    console.log("--------------------\n");

    _safeMint(msg.sender, newItemId);

    _setTokenURI(newItemId, finalTokenUri);

    _tokenIds.increment();
    mintedNumber += 1;
    console.log("An NFT w/ ID %s has been minted to %s", newItemId, msg.sender);

    emit NewEpicNFTMinted(msg.sender, newItemId);
  }
}