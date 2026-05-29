require('dotenv').config();
const mongoose = require('mongoose');
// const Country = require("../../models/CrmCountry");
const Country = require("./models/CrmCountry");

// 👉 paste your data here
const countries = [
  {
    "countryCode": true,
    "sortName": "AF",
    "name": "Afghanistan"
  },
  {
    "countryCode": 2,
    "sortName": "AL",
    "name": "Albania"
  },
  {
    "countryCode": 3,
    "sortName": "DZ",
    "name": "Algeria"
  },
  {
    "countryCode": 4,
    "sortName": "AS",
    "name": "American Samoa"
  },
  {
    "countryCode": 5,
    "sortName": "AD",
    "name": "Andorra"
  },
  {
    "countryCode": 6,
    "sortName": "AO",
    "name": "Angola"
  },
  {
    "countryCode": 7,
    "sortName": "AI",
    "name": "Anguilla"
  },
  {
    "countryCode": 8,
    "sortName": "AQ",
    "name": "Antarctica"
  },
  {
    "countryCode": 9,
    "sortName": "AG",
    "name": "Antigua And Barbuda"
  },
  {
    "countryCode": 10,
    "sortName": "AR",
    "name": "Argentina"
  },
  {
    "countryCode": 11,
    "sortName": "AM",
    "name": "Armenia"
  },
  {
    "countryCode": 12,
    "sortName": "AW",
    "name": "Aruba"
  },
  {
    "countryCode": 13,
    "sortName": "AU",
    "name": "Australia"
  },
  {
    "countryCode": 14,
    "sortName": "AT",
    "name": "Austria"
  },
  {
    "countryCode": 15,
    "sortName": "AZ",
    "name": "Azerbaijan"
  },
  {
    "countryCode": 16,
    "sortName": "BS",
    "name": "Bahamas The"
  },
  {
    "countryCode": 17,
    "sortName": "BH",
    "name": "Bahrain"
  },
  {
    "countryCode": 18,
    "sortName": "BD",
    "name": "Bangladesh"
  },
  {
    "countryCode": 19,
    "sortName": "BB",
    "name": "Barbados"
  },
  {
    "countryCode": 20,
    "sortName": "BY",
    "name": "Belarus"
  },
  {
    "countryCode": 21,
    "sortName": "BE",
    "name": "Belgium"
  },
  {
    "countryCode": 22,
    "sortName": "BZ",
    "name": "Belize"
  },
  {
    "countryCode": 23,
    "sortName": "BJ",
    "name": "Benin"
  },
  {
    "countryCode": 24,
    "sortName": "BM",
    "name": "Bermuda"
  },
  {
    "countryCode": 25,
    "sortName": "BT",
    "name": "Bhutan"
  },
  {
    "countryCode": 26,
    "sortName": "BO",
    "name": "Bolivia"
  },
  {
    "countryCode": 27,
    "sortName": "BA",
    "name": "Bosnia and Herzegovina"
  },
  {
    "countryCode": 28,
    "sortName": "BW",
    "name": "Botswana"
  },
  {
    "countryCode": 29,
    "sortName": "BV",
    "name": "Bouvet Island"
  },
  {
    "countryCode": 30,
    "sortName": "BR",
    "name": "Brazil"
  },
  {
    "countryCode": 31,
    "sortName": "IO",
    "name": "British Indian Ocean Territory"
  },
  {
    "countryCode": 32,
    "sortName": "BN",
    "name": "Brunei"
  },
  {
    "countryCode": 33,
    "sortName": "BG",
    "name": "Bulgaria"
  },
  {
    "countryCode": 34,
    "sortName": "BF",
    "name": "Burkina Faso"
  },
  {
    "countryCode": 35,
    "sortName": "BI",
    "name": "Burundi"
  },
  {
    "countryCode": 36,
    "sortName": "KH",
    "name": "Cambodia"
  },
  {
    "countryCode": 37,
    "sortName": "CM",
    "name": "Cameroon"
  },
  {
    "countryCode": 38,
    "sortName": "CA",
    "name": "Canada"
  },
  {
    "countryCode": 39,
    "sortName": "CV",
    "name": "Cape Verde"
  },
  {
    "countryCode": 40,
    "sortName": "KY",
    "name": "Cayman Islands"
  },
  {
    "countryCode": 41,
    "sortName": "CF",
    "name": "Central African Republic"
  },
  {
    "countryCode": 42,
    "sortName": "TD",
    "name": "Chad"
  },
  {
    "countryCode": 43,
    "sortName": "CL",
    "name": "Chile"
  },
  {
    "countryCode": 44,
    "sortName": "CN",
    "name": "China"
  },
  {
    "countryCode": 45,
    "sortName": "CX",
    "name": "Christmas Island"
  },
  {
    "countryCode": 46,
    "sortName": "CC",
    "name": "Cocos (Keeling"
  },
  {
    "countryCode": 47,
    "sortName": "CO",
    "name": "Colombia"
  },
  {
    "countryCode": 48,
    "sortName": "KM",
    "name": "Comoros"
  },
  {
    "countryCode": 49,
    "sortName": "CG",
    "name": "Congo"
  },
  {
    "countryCode": 50,
    "sortName": "CD",
    "name": "Congo The Democratic Republic Of The"
  },
  {
    "countryCode": 51,
    "sortName": "CK",
    "name": "Cook Islands"
  },
  {
    "countryCode": 52,
    "sortName": "CR",
    "name": "Costa Rica"
  },
  {
    "countryCode": 53,
    "sortName": "CI",
    "name": "Cote D\\Ivoire (Ivory Coast"
  },
  {
    "countryCode": 54,
    "sortName": "HR",
    "name": "Croatia (Hrvatska"
  },
  {
    "countryCode": 55,
    "sortName": "CU",
    "name": "Cuba"
  },
  {
    "countryCode": 56,
    "sortName": "CY",
    "name": "Cyprus"
  },
  {
    "countryCode": 57,
    "sortName": "CZ",
    "name": "Czech Republic"
  },
  {
    "countryCode": 58,
    "sortName": "DK",
    "name": "Denmark"
  },
  {
    "countryCode": 59,
    "sortName": "DJ",
    "name": "Djibouti"
  },
  {
    "countryCode": 60,
    "sortName": "DM",
    "name": "Dominica"
  },
  {
    "countryCode": 61,
    "sortName": "DO",
    "name": "Dominican Republic"
  },
  {
    "countryCode": 62,
    "sortName": "TP",
    "name": "East Timor"
  },
  {
    "countryCode": 63,
    "sortName": "EC",
    "name": "Ecuador"
  },
  {
    "countryCode": 64,
    "sortName": "EG",
    "name": "Egypt"
  },
  {
    "countryCode": 65,
    "sortName": "SV",
    "name": "El Salvador"
  },
  {
    "countryCode": 66,
    "sortName": "GQ",
    "name": "Equatorial Guinea"
  },
  {
    "countryCode": 67,
    "sortName": "ER",
    "name": "Eritrea"
  },
  {
    "countryCode": 68,
    "sortName": "EE",
    "name": "Estonia"
  },
  {
    "countryCode": 69,
    "sortName": "ET",
    "name": "Ethiopia"
  },
  {
    "countryCode": 70,
    "sortName": "XA",
    "name": "External Territories of Australia"
  },
  {
    "countryCode": 71,
    "sortName": "FK",
    "name": "Falkland Islands"
  },
  {
    "countryCode": 72,
    "sortName": "FO",
    "name": "Faroe Islands"
  },
  {
    "countryCode": 73,
    "sortName": "FJ",
    "name": "Fiji Islands"
  },
  {
    "countryCode": 74,
    "sortName": "FI",
    "name": "Finland"
  },
  {
    "countryCode": 75,
    "sortName": "FR",
    "name": "France"
  },
  {
    "countryCode": 76,
    "sortName": "GF",
    "name": "French Guiana"
  },
  {
    "countryCode": 77,
    "sortName": "PF",
    "name": "French Polynesia"
  },
  {
    "countryCode": 78,
    "sortName": "TF",
    "name": "French Southern Territories"
  },
  {
    "countryCode": 79,
    "sortName": "GA",
    "name": "Gabon"
  },
  {
    "countryCode": 80,
    "sortName": "GM",
    "name": "Gambia The"
  },
  {
    "countryCode": 81,
    "sortName": "GE",
    "name": "Georgia"
  },
  {
    "countryCode": 82,
    "sortName": "DE",
    "name": "Germany"
  },
  {
    "countryCode": 83,
    "sortName": "GH",
    "name": "Ghana"
  },
  {
    "countryCode": 84,
    "sortName": "GI",
    "name": "Gibraltar"
  },
  {
    "countryCode": 85,
    "sortName": "GR",
    "name": "Greece"
  },
  {
    "countryCode": 86,
    "sortName": "GL",
    "name": "Greenland"
  },
  {
    "countryCode": 87,
    "sortName": "GD",
    "name": "Grenada"
  },
  {
    "countryCode": 88,
    "sortName": "GP",
    "name": "Guadeloupe"
  },
  {
    "countryCode": 89,
    "sortName": "GU",
    "name": "Guam"
  },
  {
    "countryCode": 90,
    "sortName": "GT",
    "name": "Guatemala"
  },
  {
    "countryCode": 91,
    "sortName": "XU",
    "name": "Guernsey and Alderney"
  },
  {
    "countryCode": 92,
    "sortName": "GN",
    "name": "Guinea"
  },
  {
    "countryCode": 93,
    "sortName": "GW",
    "name": "Guinea-Bissau"
  },
  {
    "countryCode": 94,
    "sortName": "GY",
    "name": "Guyana"
  },
  {
    "countryCode": 95,
    "sortName": "HT",
    "name": "Haiti"
  },
  {
    "countryCode": 96,
    "sortName": "HM",
    "name": "Heard and McDonald Islands"
  },
  {
    "countryCode": 97,
    "sortName": "HN",
    "name": "Honduras"
  },
  {
    "countryCode": 98,
    "sortName": "HK",
    "name": "Hong Kong S.A.R."
  },
  {
    "countryCode": 99,
    "sortName": "HU",
    "name": "Hungary"
  },
  {
    "countryCode": 100,
    "sortName": "IS",
    "name": "Iceland"
  },
  {
    "countryCode": 101,
    "sortName": "IN",
    "name": "India"
  },
  {
    "countryCode": 102,
    "sortName": "ID",
    "name": "Indonesia"
  },
  {
    "countryCode": 103,
    "sortName": "IR",
    "name": "Iran"
  },
  {
    "countryCode": 104,
    "sortName": "IQ",
    "name": "Iraq"
  },
  {
    "countryCode": 105,
    "sortName": "IE",
    "name": "Ireland"
  },
  {
    "countryCode": 106,
    "sortName": "IL",
    "name": "Israel"
  },
  {
    "countryCode": 107,
    "sortName": "IT",
    "name": "Italy"
  },
  {
    "countryCode": 108,
    "sortName": "JM",
    "name": "Jamaica"
  },
  {
    "countryCode": 109,
    "sortName": "JP",
    "name": "Japan"
  },
  {
    "countryCode": 110,
    "sortName": "XJ",
    "name": "Jersey"
  },
  {
    "countryCode": 111,
    "sortName": "JO",
    "name": "Jordan"
  },
  {
    "countryCode": 112,
    "sortName": "KZ",
    "name": "Kazakhstan"
  },
  {
    "countryCode": 113,
    "sortName": "KE",
    "name": "Kenya"
  },
  {
    "countryCode": 114,
    "sortName": "KI",
    "name": "Kiribati"
  },
  {
    "countryCode": 115,
    "sortName": "KP",
    "name": "Korea North"
  },
  {
    "countryCode": 116,
    "sortName": "KR",
    "name": "Korea South"
  },
  {
    "countryCode": 117,
    "sortName": "KW",
    "name": "Kuwait"
  },
  {
    "countryCode": 118,
    "sortName": "KG",
    "name": "Kyrgyzstan"
  },
  {
    "countryCode": 119,
    "sortName": "LA",
    "name": "Laos"
  },
  {
    "countryCode": 120,
    "sortName": "LV",
    "name": "Latvia"
  },
  {
    "countryCode": 121,
    "sortName": "LB",
    "name": "Lebanon"
  },
  {
    "countryCode": 122,
    "sortName": "LS",
    "name": "Lesotho"
  },
  {
    "countryCode": 123,
    "sortName": "LR",
    "name": "Liberia"
  },
  {
    "countryCode": 124,
    "sortName": "LY",
    "name": "Libya"
  },
  {
    "countryCode": 125,
    "sortName": "LI",
    "name": "Liechtenstein"
  },
  {
    "countryCode": 126,
    "sortName": "LT",
    "name": "Lithuania"
  },
  {
    "countryCode": 127,
    "sortName": "LU",
    "name": "Luxembourg"
  },
  {
    "countryCode": 128,
    "sortName": "MO",
    "name": "Macau S.A.R."
  },
  {
    "countryCode": 129,
    "sortName": "MK",
    "name": "Macedonia"
  },
  {
    "countryCode": 130,
    "sortName": "MG",
    "name": "Madagascar"
  },
  {
    "countryCode": 131,
    "sortName": "MW",
    "name": "Malawi"
  },
  {
    "countryCode": 132,
    "sortName": "MY",
    "name": "Malaysia"
  },
  {
    "countryCode": 133,
    "sortName": "MV",
    "name": "Maldives"
  },
  {
    "countryCode": 134,
    "sortName": "ML",
    "name": "Mali"
  },
  {
    "countryCode": 135,
    "sortName": "MT",
    "name": "Malta"
  },
  {
    "countryCode": 136,
    "sortName": "XM",
    "name": "Man (Isle of"
  },
  {
    "countryCode": 137,
    "sortName": "MH",
    "name": "Marshall Islands"
  },
  {
    "countryCode": 138,
    "sortName": "MQ",
    "name": "Martinique"
  },
  {
    "countryCode": 139,
    "sortName": "MR",
    "name": "Mauritania"
  },
  {
    "countryCode": 140,
    "sortName": "MU",
    "name": "Mauritius"
  },
  {
    "countryCode": 141,
    "sortName": "YT",
    "name": "Mayotte"
  },
  {
    "countryCode": 142,
    "sortName": "MX",
    "name": "Mexico"
  },
  {
    "countryCode": 143,
    "sortName": "FM",
    "name": "Micronesia"
  },
  {
    "countryCode": 144,
    "sortName": "MD",
    "name": "Moldova"
  },
  {
    "countryCode": 145,
    "sortName": "MC",
    "name": "Monaco"
  },
  {
    "countryCode": 146,
    "sortName": "MN",
    "name": "Mongolia"
  },
  {
    "countryCode": 147,
    "sortName": "MS",
    "name": "Montserrat"
  },
  {
    "countryCode": 148,
    "sortName": "MA",
    "name": "Morocco"
  },
  {
    "countryCode": 149,
    "sortName": "MZ",
    "name": "Mozambique"
  },
  {
    "countryCode": 150,
    "sortName": "MM",
    "name": "Myanmar"
  },
  {
    "countryCode": 151,
    "sortName": "NA",
    "name": "Namibia"
  },
  {
    "countryCode": 152,
    "sortName": "NR",
    "name": "Nauru"
  },
  {
    "countryCode": 153,
    "sortName": "NP",
    "name": "Nepal"
  },
  {
    "countryCode": 154,
    "sortName": "AN",
    "name": "Netherlands Antilles"
  },
  {
    "countryCode": 155,
    "sortName": "NL",
    "name": "Netherlands The"
  },
  {
    "countryCode": 156,
    "sortName": "NC",
    "name": "New Caledonia"
  },
  {
    "countryCode": 157,
    "sortName": "NZ",
    "name": "New Zealand"
  },
  {
    "countryCode": 158,
    "sortName": "NI",
    "name": "Nicaragua"
  },
  {
    "countryCode": 159,
    "sortName": "NE",
    "name": "Niger"
  },
  {
    "countryCode": 160,
    "sortName": "NG",
    "name": "Nigeria"
  },
  {
    "countryCode": 161,
    "sortName": "NU",
    "name": "Niue"
  },
  {
    "countryCode": 162,
    "sortName": "NF",
    "name": "Norfolk Island"
  },
  {
    "countryCode": 163,
    "sortName": "MP",
    "name": "Northern Mariana Islands"
  },
  {
    "countryCode": 164,
    "sortName": "NO",
    "name": "Norway"
  },
  {
    "countryCode": 165,
    "sortName": "OM",
    "name": "Oman"
  },
  {
    "countryCode": 166,
    "sortName": "PK",
    "name": "Pakistan"
  },
  {
    "countryCode": 167,
    "sortName": "PW",
    "name": "Palau"
  },
  {
    "countryCode": 168,
    "sortName": "PS",
    "name": "Palestinian Territory Occupied"
  },
  {
    "countryCode": 169,
    "sortName": "PA",
    "name": "Panama"
  },
  {
    "countryCode": 170,
    "sortName": "PG",
    "name": "Papua new Guinea"
  },
  {
    "countryCode": 171,
    "sortName": "PY",
    "name": "Paraguay"
  },
  {
    "countryCode": 172,
    "sortName": "PE",
    "name": "Peru"
  },
  {
    "countryCode": 173,
    "sortName": "PH",
    "name": "Philippines"
  },
  {
    "countryCode": 174,
    "sortName": "PN",
    "name": "Pitcairn Island"
  },
  {
    "countryCode": 175,
    "sortName": "PL",
    "name": "Poland"
  },
  {
    "countryCode": 176,
    "sortName": "PT",
    "name": "Portugal"
  },
  {
    "countryCode": 177,
    "sortName": "PR",
    "name": "Puerto Rico"
  },
  {
    "countryCode": 178,
    "sortName": "QA",
    "name": "Qatar"
  },
  {
    "countryCode": 179,
    "sortName": "RE",
    "name": "Reunion"
  },
  {
    "countryCode": 180,
    "sortName": "RO",
    "name": "Romania"
  },
  {
    "countryCode": 181,
    "sortName": "RU",
    "name": "Russia"
  },
  {
    "countryCode": 182,
    "sortName": "RW",
    "name": "Rwanda"
  },
  {
    "countryCode": 183,
    "sortName": "SH",
    "name": "Saint Helena"
  },
  {
    "countryCode": 184,
    "sortName": "KN",
    "name": "Saint Kitts And Nevis"
  },
  {
    "countryCode": 185,
    "sortName": "LC",
    "name": "Saint Lucia"
  },
  {
    "countryCode": 186,
    "sortName": "PM",
    "name": "Saint Pierre and Miquelon"
  },
  {
    "countryCode": 187,
    "sortName": "VC",
    "name": "Saint Vincent And The Grenadines"
  },
  {
    "countryCode": 188,
    "sortName": "WS",
    "name": "Samoa"
  },
  {
    "countryCode": 189,
    "sortName": "SM",
    "name": "San Marino"
  },
  {
    "countryCode": 190,
    "sortName": "ST",
    "name": "Sao Tome and Principe"
  },
  {
    "countryCode": 191,
    "sortName": "SA",
    "name": "Saudi Arabia"
  },
  {
    "countryCode": 192,
    "sortName": "SN",
    "name": "Senegal"
  },
  {
    "countryCode": 193,
    "sortName": "RS",
    "name": "Serbia"
  },
  {
    "countryCode": 194,
    "sortName": "SC",
    "name": "Seychelles"
  },
  {
    "countryCode": 195,
    "sortName": "SL",
    "name": "Sierra Leone"
  },
  {
    "countryCode": 196,
    "sortName": "SG",
    "name": "Singapore"
  },
  {
    "countryCode": 197,
    "sortName": "SK",
    "name": "Slovakia"
  },
  {
    "countryCode": 198,
    "sortName": "SI",
    "name": "Slovenia"
  },
  {
    "countryCode": 199,
    "sortName": "XG",
    "name": "Smaller Territories of the UK"
  },
  {
    "countryCode": 200,
    "sortName": "SB",
    "name": "Solomon Islands"
  },
  {
    "countryCode": 201,
    "sortName": "SO",
    "name": "Somalia"
  },
  {
    "countryCode": 202,
    "sortName": "ZA",
    "name": "South Africa"
  },
  {
    "countryCode": 203,
    "sortName": "GS",
    "name": "South Georgia"
  },
  {
    "countryCode": 204,
    "sortName": "SS",
    "name": "South Sudan"
  },
  {
    "countryCode": 205,
    "sortName": "ES",
    "name": "Spain"
  },
  {
    "countryCode": 206,
    "sortName": "LK",
    "name": "Sri Lanka"
  },
  {
    "countryCode": 207,
    "sortName": "SD",
    "name": "Sudan"
  },
  {
    "countryCode": 208,
    "sortName": "SR",
    "name": "Suriname"
  },
  {
    "countryCode": 209,
    "sortName": "SJ",
    "name": "Svalbard And Jan Mayen Islands"
  },
  {
    "countryCode": 210,
    "sortName": "SZ",
    "name": "Swaziland"
  },
  {
    "countryCode": 211,
    "sortName": "SE",
    "name": "Sweden"
  },
  {
    "countryCode": 212,
    "sortName": "CH",
    "name": "Switzerland"
  },
  {
    "countryCode": 213,
    "sortName": "SY",
    "name": "Syria"
  },
  {
    "countryCode": 214,
    "sortName": "TW",
    "name": "Taiwan"
  },
  {
    "countryCode": 215,
    "sortName": "TJ",
    "name": "Tajikistan"
  },
  {
    "countryCode": 216,
    "sortName": "TZ",
    "name": "Tanzania"
  },
  {
    "countryCode": 217,
    "sortName": "TH",
    "name": "Thailand"
  },
  {
    "countryCode": 218,
    "sortName": "TG",
    "name": "Togo"
  },
  {
    "countryCode": 219,
    "sortName": "TK",
    "name": "Tokelau"
  },
  {
    "countryCode": 220,
    "sortName": "TO",
    "name": "Tonga"
  },
  {
    "countryCode": 221,
    "sortName": "TT",
    "name": "Trinidad And Tobago"
  },
  {
    "countryCode": 222,
    "sortName": "TN",
    "name": "Tunisia"
  },
  {
    "countryCode": 223,
    "sortName": "TR",
    "name": "Turkey"
  },
  {
    "countryCode": 224,
    "sortName": "TM",
    "name": "Turkmenistan"
  },
  {
    "countryCode": 225,
    "sortName": "TC",
    "name": "Turks And Caicos Islands"
  },
  {
    "countryCode": 226,
    "sortName": "TV",
    "name": "Tuvalu"
  },
  {
    "countryCode": 227,
    "sortName": "UG",
    "name": "Uganda"
  },
  {
    "countryCode": 228,
    "sortName": "UA",
    "name": "Ukraine"
  },
  {
    "countryCode": 229,
    "sortName": "AE",
    "name": "United Arab Emirates"
  },
  {
    "countryCode": 230,
    "sortName": "GB",
    "name": "United Kingdom"
  },
  {
    "countryCode": 231,
    "sortName": "US",
    "name": "United States"
  },
  {
    "countryCode": 232,
    "sortName": "UM",
    "name": "United States Minor Outlying Islands"
  },
  {
    "countryCode": 233,
    "sortName": "UY",
    "name": "Uruguay"
  },
  {
    "countryCode": 234,
    "sortName": "UZ",
    "name": "Uzbekistan"
  },
  {
    "countryCode": 235,
    "sortName": "VU",
    "name": "Vanuatu"
  },
  {
    "countryCode": 236,
    "sortName": "VA",
    "name": "Vatican City State (Holy See"
  },
  {
    "countryCode": 237,
    "sortName": "VE",
    "name": "Venezuela"
  },
  {
    "countryCode": 238,
    "sortName": "VN",
    "name": "Vietnam"
  },
  {
    "countryCode": 239,
    "sortName": "VG",
    "name": "Virgin Islands (British"
  },
  {
    "countryCode": 240,
    "sortName": "VI",
    "name": "Virgin Islands (US"
  },
  {
    "countryCode": 241,
    "sortName": "WF",
    "name": "Wallis And Futuna Islands"
  },
  {
    "countryCode": 242,
    "sortName": "EH",
    "name": "Western Sahara"
  },
  {
    "countryCode": 243,
    "sortName": "YE",
    "name": "Yemen"
  },
  {
    "countryCode": 244,
    "sortName": "YU",
    "name": "Yugoslavia"
  },
  {
    "countryCode": 245,
    "sortName": "ZM",
    "name": "Zambia"
  },
  {
    "countryCode": 246,
    "sortName": "ZW",
    "name": "Zimbabwe"
  },
  {
    "countryCode": 247,
    "sortName": "EN",
    "name": "England"
  }
];

const seedCountries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    console.log("DB Connected");

    // 🔥 Clear old data
    await Country.deleteMany();

    // 🔥 Insert new
    await Country.insertMany(countries);

    console.log("Countries Seeded Successfully ✅");

    process.exit();

  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

seedCountries();