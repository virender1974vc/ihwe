require('dotenv').config();
const mongoose = require('mongoose');
const State = require("./models/CrmState");

// 👉 cleaned data (sample)
const states = [
  {
    "stateCode": true,
    "name": "Andaman and Nicobar Islands",
    "countryCode": 101
  },
  {
    "stateCode": 2,
    "name": "Andhra Pradesh",
    "countryCode": 101
  },
  {
    "stateCode": 3,
    "name": "Arunachal Pradesh",
    "countryCode": 101
  },
  {
    "stateCode": 4,
    "name": "Assam",
    "countryCode": 101
  },
  {
    "stateCode": 5,
    "name": "Bihar",
    "countryCode": 101
  },
  {
    "stateCode": 6,
    "name": "Chandigarh",
    "countryCode": 101
  },
  {
    "stateCode": 7,
    "name": "Chhattisgarh",
    "countryCode": 101
  },
  {
    "stateCode": 8,
    "name": "Dadra and Nagar Haveli",
    "countryCode": 101
  },
  {
    "stateCode": 9,
    "name": "Daman and Diu",
    "countryCode": 101
  },
  {
    "stateCode": 10,
    "name": "Delhi",
    "countryCode": 101
  },
  {
    "stateCode": 11,
    "name": "Goa",
    "countryCode": 101
  },
  {
    "stateCode": 12,
    "name": "Gujarat",
    "countryCode": 101
  },
  {
    "stateCode": 13,
    "name": "Haryana",
    "countryCode": 101
  },
  {
    "stateCode": 14,
    "name": "Himachal Pradesh",
    "countryCode": 101
  },
  {
    "stateCode": 15,
    "name": "Jammu and Kashmir",
    "countryCode": 101
  },
  {
    "stateCode": 16,
    "name": "Jharkhand",
    "countryCode": 101
  },
  {
    "stateCode": 17,
    "name": "Karnataka",
    "countryCode": 101
  },
  {
    "stateCode": 19,
    "name": "Kerala",
    "countryCode": 101
  },
  {
    "stateCode": 20,
    "name": "Lakshadweep",
    "countryCode": 101
  },
  {
    "stateCode": 21,
    "name": "Madhya Pradesh",
    "countryCode": 101
  },
  {
    "stateCode": 22,
    "name": "Maharashtra",
    "countryCode": 101
  },
  {
    "stateCode": 23,
    "name": "Manipur",
    "countryCode": 101
  },
  {
    "stateCode": 24,
    "name": "Meghalaya",
    "countryCode": 101
  },
  {
    "stateCode": 25,
    "name": "Mizoram",
    "countryCode": 101
  },
  {
    "stateCode": 26,
    "name": "Nagaland",
    "countryCode": 101
  },
  {
    "stateCode": 29,
    "name": "Odisha",
    "countryCode": 101
  },
  {
    "stateCode": 31,
    "name": "Pondicherry",
    "countryCode": 101
  },
  {
    "stateCode": 32,
    "name": "Punjab",
    "countryCode": 101
  },
  {
    "stateCode": 33,
    "name": "Rajasthan",
    "countryCode": 101
  },
  {
    "stateCode": 34,
    "name": "Sikkim",
    "countryCode": 101
  },
  {
    "stateCode": 35,
    "name": "Tamil Nadu",
    "countryCode": 101
  },
  {
    "stateCode": 36,
    "name": "Telangana",
    "countryCode": 101
  },
  {
    "stateCode": 37,
    "name": "Tripura",
    "countryCode": 101
  },
  {
    "stateCode": 38,
    "name": "Uttar Pradesh",
    "countryCode": 101
  },
  {
    "stateCode": 39,
    "name": "Uttarakhand",
    "countryCode": 101
  },
  {
    "stateCode": 41,
    "name": "West Bengal",
    "countryCode": 101
  },
  {
    "stateCode": 42,
    "name": "Badakhshan",
    "countryCode": true
  },
  {
    "stateCode": 43,
    "name": "Badgis",
    "countryCode": true
  },
  {
    "stateCode": 44,
    "name": "Baglan",
    "countryCode": true
  },
  {
    "stateCode": 45,
    "name": "Balkh",
    "countryCode": true
  },
  {
    "stateCode": 46,
    "name": "Bamiyan",
    "countryCode": true
  },
  {
    "stateCode": 47,
    "name": "Farah",
    "countryCode": true
  },
  {
    "stateCode": 48,
    "name": "Faryab",
    "countryCode": true
  },
  {
    "stateCode": 49,
    "name": "Gawr",
    "countryCode": true
  },
  {
    "stateCode": 50,
    "name": "Gazni",
    "countryCode": true
  },
  {
    "stateCode": 51,
    "name": "Herat",
    "countryCode": true
  },
  {
    "stateCode": 52,
    "name": "Hilmand",
    "countryCode": true
  },
  {
    "stateCode": 53,
    "name": "Jawzjan",
    "countryCode": true
  },
  {
    "stateCode": 54,
    "name": "Kabul",
    "countryCode": true
  },
  {
    "stateCode": 55,
    "name": "Kapisa",
    "countryCode": true
  },
  {
    "stateCode": 56,
    "name": "Khawst",
    "countryCode": true
  },
  {
    "stateCode": 57,
    "name": "Kunar",
    "countryCode": true
  },
  {
    "stateCode": 58,
    "name": "Lagman",
    "countryCode": true
  },
  {
    "stateCode": 59,
    "name": "Lawghar",
    "countryCode": true
  },
  {
    "stateCode": 60,
    "name": "Nangarhar",
    "countryCode": true
  },
  {
    "stateCode": 61,
    "name": "Nimruz",
    "countryCode": true
  },
  {
    "stateCode": 62,
    "name": "Nuristan",
    "countryCode": true
  },
  {
    "stateCode": 63,
    "name": "Paktika",
    "countryCode": true
  },
  {
    "stateCode": 64,
    "name": "Paktiya",
    "countryCode": true
  },
  {
    "stateCode": 65,
    "name": "Parwan",
    "countryCode": true
  },
  {
    "stateCode": 66,
    "name": "Qandahar",
    "countryCode": true
  },
  {
    "stateCode": 67,
    "name": "Qunduz",
    "countryCode": true
  },
  {
    "stateCode": 68,
    "name": "Samangan",
    "countryCode": true
  },
  {
    "stateCode": 69,
    "name": "Sar-e Pul",
    "countryCode": true
  },
  {
    "stateCode": 70,
    "name": "Takhar",
    "countryCode": true
  },
  {
    "stateCode": 71,
    "name": "Uruzgan",
    "countryCode": true
  },
  {
    "stateCode": 72,
    "name": "Wardag",
    "countryCode": true
  },
  {
    "stateCode": 73,
    "name": "Zabul",
    "countryCode": true
  },
  {
    "stateCode": 74,
    "name": "Berat",
    "countryCode": 2
  },
  {
    "stateCode": 75,
    "name": "Bulqize",
    "countryCode": 2
  },
  {
    "stateCode": 76,
    "name": "Delvine",
    "countryCode": 2
  },
  {
    "stateCode": 77,
    "name": "Devoll",
    "countryCode": 2
  },
  {
    "stateCode": 78,
    "name": "Dibre",
    "countryCode": 2
  },
  {
    "stateCode": 79,
    "name": "Durres",
    "countryCode": 2
  },
  {
    "stateCode": 80,
    "name": "Elbasan",
    "countryCode": 2
  },
  {
    "stateCode": 81,
    "name": "Fier",
    "countryCode": 2
  },
  {
    "stateCode": 82,
    "name": "Gjirokaster",
    "countryCode": 2
  },
  {
    "stateCode": 83,
    "name": "Gramsh",
    "countryCode": 2
  },
  {
    "stateCode": 84,
    "name": "Has",
    "countryCode": 2
  },
  {
    "stateCode": 85,
    "name": "Kavaje",
    "countryCode": 2
  },
  {
    "stateCode": 86,
    "name": "Kolonje",
    "countryCode": 2
  },
  {
    "stateCode": 87,
    "name": "Korce",
    "countryCode": 2
  },
  {
    "stateCode": 88,
    "name": "Kruje",
    "countryCode": 2
  },
  {
    "stateCode": 89,
    "name": "Kucove",
    "countryCode": 2
  },
  {
    "stateCode": 90,
    "name": "Kukes",
    "countryCode": 2
  },
  {
    "stateCode": 91,
    "name": "Kurbin",
    "countryCode": 2
  },
  {
    "stateCode": 92,
    "name": "Lezhe",
    "countryCode": 2
  },
  {
    "stateCode": 93,
    "name": "Librazhd",
    "countryCode": 2
  },
  {
    "stateCode": 94,
    "name": "Lushnje",
    "countryCode": 2
  },
  {
    "stateCode": 95,
    "name": "Mallakaster",
    "countryCode": 2
  },
  {
    "stateCode": 96,
    "name": "Malsi e Madhe",
    "countryCode": 2
  },
  {
    "stateCode": 97,
    "name": "Mat",
    "countryCode": 2
  },
  {
    "stateCode": 98,
    "name": "Mirdite",
    "countryCode": 2
  },
  {
    "stateCode": 99,
    "name": "Peqin",
    "countryCode": 2
  },
  {
    "stateCode": 100,
    "name": "Permet",
    "countryCode": 2
  },
  {
    "stateCode": 101,
    "name": "Pogradec",
    "countryCode": 2
  },
  {
    "stateCode": 102,
    "name": "Puke",
    "countryCode": 2
  },
  {
    "stateCode": 103,
    "name": "Sarande",
    "countryCode": 2
  },
  {
    "stateCode": 104,
    "name": "Shkoder",
    "countryCode": 2
  },
  {
    "stateCode": 105,
    "name": "Skrapar",
    "countryCode": 2
  },
  {
    "stateCode": 106,
    "name": "Tepelene",
    "countryCode": 2
  },
  {
    "stateCode": 107,
    "name": "Tirane",
    "countryCode": 2
  },
  {
    "stateCode": 108,
    "name": "Tropoje",
    "countryCode": 2
  },
  {
    "stateCode": 109,
    "name": "Vlore",
    "countryCode": 2
  },
  {
    "stateCode": 110,
    "name": "\\Ayn Daflah, 3"
  },
  {
    "stateCode": 111,
    "name": "\\Ayn Tamushanat, 3"
  },
  {
    "stateCode": 112,
    "name": "Adrar",
    "countryCode": 3
  },
  {
    "stateCode": 113,
    "name": "Algiers",
    "countryCode": 3
  },
  {
    "stateCode": 114,
    "name": "Annabah",
    "countryCode": 3
  },
  {
    "stateCode": 115,
    "name": "Bashshar",
    "countryCode": 3
  },
  {
    "stateCode": 116,
    "name": "Batnah",
    "countryCode": 3
  },
  {
    "stateCode": 117,
    "name": "Bijayah",
    "countryCode": 3
  },
  {
    "stateCode": 118,
    "name": "Biskrah",
    "countryCode": 3
  },
  {
    "stateCode": 119,
    "name": "Blidah",
    "countryCode": 3
  },
  {
    "stateCode": 120,
    "name": "Buirah",
    "countryCode": 3
  },
  {
    "stateCode": 121,
    "name": "Bumardas",
    "countryCode": 3
  },
  {
    "stateCode": 122,
    "name": "Burj Bu Arririj",
    "countryCode": 3
  },
  {
    "stateCode": 123,
    "name": "Ghalizan",
    "countryCode": 3
  },
  {
    "stateCode": 124,
    "name": "Ghardayah",
    "countryCode": 3
  },
  {
    "stateCode": 125,
    "name": "Ilizi",
    "countryCode": 3
  },
  {
    "stateCode": 126,
    "name": "Jijili",
    "countryCode": 3
  },
  {
    "stateCode": 127,
    "name": "Jilfah",
    "countryCode": 3
  },
  {
    "stateCode": 128,
    "name": "Khanshalah",
    "countryCode": 3
  },
  {
    "stateCode": 129,
    "name": "Masilah",
    "countryCode": 3
  },
  {
    "stateCode": 130,
    "name": "Midyah",
    "countryCode": 3
  },
  {
    "stateCode": 131,
    "name": "Milah",
    "countryCode": 3
  },
  {
    "stateCode": 132,
    "name": "Muaskar",
    "countryCode": 3
  },
  {
    "stateCode": 133,
    "name": "Mustaghanam",
    "countryCode": 3
  },
  {
    "stateCode": 134,
    "name": "Naama",
    "countryCode": 3
  },
  {
    "stateCode": 135,
    "name": "Oran",
    "countryCode": 3
  },
  {
    "stateCode": 136,
    "name": "Ouargla",
    "countryCode": 3
  },
  {
    "stateCode": 137,
    "name": "Qalmah",
    "countryCode": 3
  },
  {
    "stateCode": 138,
    "name": "Qustantinah",
    "countryCode": 3
  },
  {
    "stateCode": 139,
    "name": "Sakikdah",
    "countryCode": 3
  },
  {
    "stateCode": 140,
    "name": "Satif",
    "countryCode": 3
  },
  {
    "stateCode": 141,
    "name": "Sayda\\', 3"
  },
  {
    "stateCode": 142,
    "name": "Sidi ban-al-\\Abbas, 3"
  },
  {
    "stateCode": 143,
    "name": "Suq Ahras",
    "countryCode": 3
  },
  {
    "stateCode": 144,
    "name": "Tamanghasat",
    "countryCode": 3
  },
  {
    "stateCode": 145,
    "name": "Tibazah",
    "countryCode": 3
  },
  {
    "stateCode": 146,
    "name": "Tibissah",
    "countryCode": 3
  },
  {
    "stateCode": 147,
    "name": "Tilimsan",
    "countryCode": 3
  },
  {
    "stateCode": 148,
    "name": "Tinduf",
    "countryCode": 3
  },
  {
    "stateCode": 149,
    "name": "Tisamsilt",
    "countryCode": 3
  },
  {
    "stateCode": 150,
    "name": "Tiyarat",
    "countryCode": 3
  },
  {
    "stateCode": 151,
    "name": "Tizi Wazu",
    "countryCode": 3
  },
  {
    "stateCode": 152,
    "name": "Umm-al-Bawaghi",
    "countryCode": 3
  },
  {
    "stateCode": 153,
    "name": "Wahran",
    "countryCode": 3
  },
  {
    "stateCode": 154,
    "name": "Warqla",
    "countryCode": 3
  },
  {
    "stateCode": 155,
    "name": "Wilaya d Alger",
    "countryCode": 3
  },
  {
    "stateCode": 156,
    "name": "Wilaya de Bejaia",
    "countryCode": 3
  },
  {
    "stateCode": 157,
    "name": "Wilaya de Constantine",
    "countryCode": 3
  },
  {
    "stateCode": 158,
    "name": "al-Aghwat",
    "countryCode": 3
  },
  {
    "stateCode": 159,
    "name": "al-Bayadh",
    "countryCode": 3
  },
  {
    "stateCode": 160,
    "name": "al-Jaza\\ir, 3"
  },
  {
    "stateCode": 161,
    "name": "al-Wad",
    "countryCode": 3
  },
  {
    "stateCode": 162,
    "name": "ash-Shalif",
    "countryCode": 3
  },
  {
    "stateCode": 163,
    "name": "at-Tarif",
    "countryCode": 3
  },
  {
    "stateCode": 164,
    "name": "Eastern",
    "countryCode": 4
  },
  {
    "stateCode": 165,
    "name": "Manu\\a, 4"
  },
  {
    "stateCode": 166,
    "name": "Swains Island",
    "countryCode": 4
  },
  {
    "stateCode": 167,
    "name": "Western",
    "countryCode": 4
  },
  {
    "stateCode": 168,
    "name": "Andorra la Vella",
    "countryCode": 5
  },
  {
    "stateCode": 169,
    "name": "Canillo",
    "countryCode": 5
  },
  {
    "stateCode": 170,
    "name": "Encamp",
    "countryCode": 5
  },
  {
    "stateCode": 171,
    "name": "La Massana",
    "countryCode": 5
  },
  {
    "stateCode": 172,
    "name": "Les Escaldes",
    "countryCode": 5
  },
  {
    "stateCode": 173,
    "name": "Ordino",
    "countryCode": 5
  },
  {
    "stateCode": 174,
    "name": "Sant Julia de Loria",
    "countryCode": 5
  },
  {
    "stateCode": 175,
    "name": "Bengo",
    "countryCode": 6
  },
  {
    "stateCode": 176,
    "name": "Benguela",
    "countryCode": 6
  },
  {
    "stateCode": 177,
    "name": "Bie",
    "countryCode": 6
  },
  {
    "stateCode": 178,
    "name": "Cabinda",
    "countryCode": 6
  },
  {
    "stateCode": 179,
    "name": "Cunene",
    "countryCode": 6
  },
  {
    "stateCode": 180,
    "name": "Huambo",
    "countryCode": 6
  },
  {
    "stateCode": 181,
    "name": "Huila",
    "countryCode": 6
  },
  {
    "stateCode": 182,
    "name": "Kuando-Kubango",
    "countryCode": 6
  },
  {
    "stateCode": 183,
    "name": "Kwanza Norte",
    "countryCode": 6
  },
  {
    "stateCode": 184,
    "name": "Kwanza Sul",
    "countryCode": 6
  },
  {
    "stateCode": 185,
    "name": "Luanda",
    "countryCode": 6
  },
  {
    "stateCode": 186,
    "name": "Lunda Norte",
    "countryCode": 6
  },
  {
    "stateCode": 187,
    "name": "Lunda Sul",
    "countryCode": 6
  },
  {
    "stateCode": 188,
    "name": "Malanje",
    "countryCode": 6
  },
  {
    "stateCode": 189,
    "name": "Moxico",
    "countryCode": 6
  },
  {
    "stateCode": 190,
    "name": "Namibe",
    "countryCode": 6
  },
  {
    "stateCode": 191,
    "name": "Uige",
    "countryCode": 6
  },
  {
    "stateCode": 192,
    "name": "Zaire",
    "countryCode": 6
  },
  {
    "stateCode": 193,
    "name": "Other Provinces",
    "countryCode": 7
  },
  {
    "stateCode": 194,
    "name": "Sector claimed by Argentina/Ch",
    "countryCode": 8
  },
  {
    "stateCode": 195,
    "name": "Sector claimed by Argentina/UK",
    "countryCode": 8
  },
  {
    "stateCode": 196,
    "name": "Sector claimed by Australia",
    "countryCode": 8
  },
  {
    "stateCode": 197,
    "name": "Sector claimed by France",
    "countryCode": 8
  },
  {
    "stateCode": 198,
    "name": "Sector claimed by New Zealand",
    "countryCode": 8
  },
  {
    "stateCode": 199,
    "name": "Sector claimed by Norway",
    "countryCode": 8
  },
  {
    "stateCode": 200,
    "name": "Unclaimed Sector",
    "countryCode": 8
  },
  {
    "stateCode": 201,
    "name": "Barbuda",
    "countryCode": 9
  },
  {
    "stateCode": 202,
    "name": "Saint George",
    "countryCode": 9
  },
  {
    "stateCode": 203,
    "name": "Saint John",
    "countryCode": 9
  },
  {
    "stateCode": 204,
    "name": "Saint Mary",
    "countryCode": 9
  },
  {
    "stateCode": 205,
    "name": "Saint Paul",
    "countryCode": 9
  },
  {
    "stateCode": 206,
    "name": "Saint Peter",
    "countryCode": 9
  },
  {
    "stateCode": 207,
    "name": "Saint Philip",
    "countryCode": 9
  },
  {
    "stateCode": 208,
    "name": "Buenos Aires",
    "countryCode": 10
  },
  {
    "stateCode": 209,
    "name": "Catamarca",
    "countryCode": 10
  },
  {
    "stateCode": 210,
    "name": "Chaco",
    "countryCode": 10
  },
  {
    "stateCode": 211,
    "name": "Chubut",
    "countryCode": 10
  },
  {
    "stateCode": 212,
    "name": "Cordoba",
    "countryCode": 10
  },
  {
    "stateCode": 213,
    "name": "Corrientes",
    "countryCode": 10
  },
  {
    "stateCode": 214,
    "name": "Distrito Federal",
    "countryCode": 10
  },
  {
    "stateCode": 215,
    "name": "Entre Rios",
    "countryCode": 10
  },
  {
    "stateCode": 216,
    "name": "Formosa",
    "countryCode": 10
  },
  {
    "stateCode": 217,
    "name": "Jujuy",
    "countryCode": 10
  },
  {
    "stateCode": 218,
    "name": "La Pampa",
    "countryCode": 10
  },
  {
    "stateCode": 219,
    "name": "La Rioja",
    "countryCode": 10
  },
  {
    "stateCode": 220,
    "name": "Mendoza",
    "countryCode": 10
  },
  {
    "stateCode": 221,
    "name": "Misiones",
    "countryCode": 10
  },
  {
    "stateCode": 222,
    "name": "Neuquen",
    "countryCode": 10
  },
  {
    "stateCode": 223,
    "name": "Rio Negro",
    "countryCode": 10
  },
  {
    "stateCode": 224,
    "name": "Salta",
    "countryCode": 10
  },
  {
    "stateCode": 225,
    "name": "San Juan",
    "countryCode": 10
  },
  {
    "stateCode": 226,
    "name": "San Luis",
    "countryCode": 10
  },
  {
    "stateCode": 227,
    "name": "Santa Cruz",
    "countryCode": 10
  },
  {
    "stateCode": 228,
    "name": "Santa Fe",
    "countryCode": 10
  },
  {
    "stateCode": 229,
    "name": "Santiago del Estero",
    "countryCode": 10
  },
  {
    "stateCode": 230,
    "name": "Tierra del Fuego",
    "countryCode": 10
  },
  {
    "stateCode": 231,
    "name": "Tucuman",
    "countryCode": 10
  },
  {
    "stateCode": 232,
    "name": "Aragatsotn",
    "countryCode": 11
  },
  {
    "stateCode": 233,
    "name": "Ararat",
    "countryCode": 11
  },
  {
    "stateCode": 234,
    "name": "Armavir",
    "countryCode": 11
  },
  {
    "stateCode": 235,
    "name": "Gegharkunik",
    "countryCode": 11
  },
  {
    "stateCode": 236,
    "name": "Kotaik",
    "countryCode": 11
  },
  {
    "stateCode": 237,
    "name": "Lori",
    "countryCode": 11
  },
  {
    "stateCode": 238,
    "name": "Shirak",
    "countryCode": 11
  },
  {
    "stateCode": 239,
    "name": "Stepanakert",
    "countryCode": 11
  },
  {
    "stateCode": 240,
    "name": "Syunik",
    "countryCode": 11
  },
  {
    "stateCode": 241,
    "name": "Tavush",
    "countryCode": 11
  },
  {
    "stateCode": 242,
    "name": "Vayots Dzor",
    "countryCode": 11
  },
  {
    "stateCode": 243,
    "name": "Yerevan",
    "countryCode": 11
  },
  {
    "stateCode": 244,
    "name": "Aruba",
    "countryCode": 12
  },
  {
    "stateCode": 245,
    "name": "Auckland",
    "countryCode": 13
  },
  {
    "stateCode": 246,
    "name": "Australian Capital Territory",
    "countryCode": 13
  },
  {
    "stateCode": 247,
    "name": "Balgowlah",
    "countryCode": 13
  },
  {
    "stateCode": 248,
    "name": "Balmain",
    "countryCode": 13
  },
  {
    "stateCode": 249,
    "name": "Bankstown",
    "countryCode": 13
  },
  {
    "stateCode": 250,
    "name": "Baulkham Hills",
    "countryCode": 13
  },
  {
    "stateCode": 251,
    "name": "Bonnet Bay",
    "countryCode": 13
  },
  {
    "stateCode": 252,
    "name": "Camberwell",
    "countryCode": 13
  },
  {
    "stateCode": 253,
    "name": "Carole Park",
    "countryCode": 13
  },
  {
    "stateCode": 254,
    "name": "Castle Hill",
    "countryCode": 13
  },
  {
    "stateCode": 255,
    "name": "Caulfield",
    "countryCode": 13
  },
  {
    "stateCode": 256,
    "name": "Chatswood",
    "countryCode": 13
  },
  {
    "stateCode": 257,
    "name": "Cheltenham",
    "countryCode": 13
  },
  {
    "stateCode": 258,
    "name": "Cherrybrook",
    "countryCode": 13
  },
  {
    "stateCode": 259,
    "name": "Clayton",
    "countryCode": 13
  },
  {
    "stateCode": 260,
    "name": "Collingwood",
    "countryCode": 13
  },
  {
    "stateCode": 261,
    "name": "Frenchs Forest",
    "countryCode": 13
  },
  {
    "stateCode": 262,
    "name": "Hawthorn",
    "countryCode": 13
  },
  {
    "stateCode": 263,
    "name": "Jannnali",
    "countryCode": 13
  },
  {
    "stateCode": 264,
    "name": "Knoxfield",
    "countryCode": 13
  },
  {
    "stateCode": 265,
    "name": "Melbourne",
    "countryCode": 13
  },
  {
    "stateCode": 266,
    "name": "New South Wales",
    "countryCode": 13
  },
  {
    "stateCode": 267,
    "name": "Northern Territory",
    "countryCode": 13
  },
  {
    "stateCode": 268,
    "name": "Perth",
    "countryCode": 13
  },
  {
    "stateCode": 269,
    "name": "Queensland",
    "countryCode": 13
  },
  {
    "stateCode": 270,
    "name": "South Australia",
    "countryCode": 13
  },
  {
    "stateCode": 271,
    "name": "Tasmania",
    "countryCode": 13
  },
  {
    "stateCode": 272,
    "name": "Templestowe",
    "countryCode": 13
  },
  {
    "stateCode": 273,
    "name": "Victoria",
    "countryCode": 13
  },
  {
    "stateCode": 274,
    "name": "Werribee south",
    "countryCode": 13
  },
  {
    "stateCode": 275,
    "name": "Western Australia",
    "countryCode": 13
  },
  {
    "stateCode": 276,
    "name": "Wheeler",
    "countryCode": 13
  },
  {
    "stateCode": 277,
    "name": "Bundesland Salzburg",
    "countryCode": 14
  },
  {
    "stateCode": 278,
    "name": "Bundesland Steiermark",
    "countryCode": 14
  },
  {
    "stateCode": 279,
    "name": "Bundesland Tirol",
    "countryCode": 14
  },
  {
    "stateCode": 280,
    "name": "Burgenland",
    "countryCode": 14
  },
  {
    "stateCode": 281,
    "name": "Carinthia",
    "countryCode": 14
  },
  {
    "stateCode": 282,
    "name": "Karnten",
    "countryCode": 14
  },
  {
    "stateCode": 283,
    "name": "Liezen",
    "countryCode": 14
  },
  {
    "stateCode": 284,
    "name": "Lower Austria",
    "countryCode": 14
  },
  {
    "stateCode": 285,
    "name": "Niederosterreich",
    "countryCode": 14
  },
  {
    "stateCode": 286,
    "name": "Oberosterreich",
    "countryCode": 14
  },
  {
    "stateCode": 287,
    "name": "Salzburg",
    "countryCode": 14
  },
  {
    "stateCode": 288,
    "name": "Schleswig-Holstein",
    "countryCode": 14
  },
  {
    "stateCode": 289,
    "name": "Steiermark",
    "countryCode": 14
  },
  {
    "stateCode": 290,
    "name": "Styria",
    "countryCode": 14
  },
  {
    "stateCode": 291,
    "name": "Tirol",
    "countryCode": 14
  },
  {
    "stateCode": 292,
    "name": "Upper Austria",
    "countryCode": 14
  },
  {
    "stateCode": 293,
    "name": "Vorarlberg",
    "countryCode": 14
  },
  {
    "stateCode": 294,
    "name": "Wien",
    "countryCode": 14
  },
  {
    "stateCode": 295,
    "name": "Abseron",
    "countryCode": 15
  },
  {
    "stateCode": 296,
    "name": "Baki Sahari",
    "countryCode": 15
  },
  {
    "stateCode": 297,
    "name": "Ganca",
    "countryCode": 15
  },
  {
    "stateCode": 298,
    "name": "Ganja",
    "countryCode": 15
  },
  {
    "stateCode": 299,
    "name": "Kalbacar",
    "countryCode": 15
  },
  {
    "stateCode": 300,
    "name": "Lankaran",
    "countryCode": 15
  },
  {
    "stateCode": 301,
    "name": "Mil-Qarabax",
    "countryCode": 15
  },
  {
    "stateCode": 302,
    "name": "Mugan-Salyan",
    "countryCode": 15
  },
  {
    "stateCode": 303,
    "name": "Nagorni-Qarabax",
    "countryCode": 15
  },
  {
    "stateCode": 304,
    "name": "Naxcivan",
    "countryCode": 15
  },
  {
    "stateCode": 305,
    "name": "Priaraks",
    "countryCode": 15
  },
  {
    "stateCode": 306,
    "name": "Qazax",
    "countryCode": 15
  },
  {
    "stateCode": 307,
    "name": "Saki",
    "countryCode": 15
  },
  {
    "stateCode": 308,
    "name": "Sirvan",
    "countryCode": 15
  },
  {
    "stateCode": 309,
    "name": "Xacmaz",
    "countryCode": 15
  },
  {
    "stateCode": 310,
    "name": "Abaco",
    "countryCode": 16
  },
  {
    "stateCode": 311,
    "name": "Acklins Island",
    "countryCode": 16
  },
  {
    "stateCode": 312,
    "name": "Andros",
    "countryCode": 16
  },
  {
    "stateCode": 313,
    "name": "Berry Islands",
    "countryCode": 16
  },
  {
    "stateCode": 314,
    "name": "Biminis",
    "countryCode": 16
  },
  {
    "stateCode": 315,
    "name": "Cat Island",
    "countryCode": 16
  },
  {
    "stateCode": 316,
    "name": "Crooked Island",
    "countryCode": 16
  },
  {
    "stateCode": 317,
    "name": "Eleuthera",
    "countryCode": 16
  },
  {
    "stateCode": 318,
    "name": "Exuma and Cays",
    "countryCode": 16
  },
  {
    "stateCode": 319,
    "name": "Grand Bahama",
    "countryCode": 16
  },
  {
    "stateCode": 320,
    "name": "Inagua Islands",
    "countryCode": 16
  },
  {
    "stateCode": 321,
    "name": "Long Island",
    "countryCode": 16
  },
  {
    "stateCode": 322,
    "name": "Mayaguana",
    "countryCode": 16
  },
  {
    "stateCode": 323,
    "name": "New Providence",
    "countryCode": 16
  },
  {
    "stateCode": 324,
    "name": "Ragged Island",
    "countryCode": 16
  },
  {
    "stateCode": 325,
    "name": "Rum Cay",
    "countryCode": 16
  },
  {
    "stateCode": 326,
    "name": "San Salvador",
    "countryCode": 16
  },
  {
    "stateCode": 327,
    "name": "\\Isa, 17"
  },
  {
    "stateCode": 328,
    "name": "Badiyah",
    "countryCode": 17
  },
  {
    "stateCode": 329,
    "name": "Hidd",
    "countryCode": 17
  },
  {
    "stateCode": 330,
    "name": "Jidd Hafs",
    "countryCode": 17
  },
  {
    "stateCode": 331,
    "name": "Mahama",
    "countryCode": 17
  },
  {
    "stateCode": 332,
    "name": "Manama",
    "countryCode": 17
  },
  {
    "stateCode": 333,
    "name": "Sitrah",
    "countryCode": 17
  },
  {
    "stateCode": 334,
    "name": "al-Manamah",
    "countryCode": 17
  },
  {
    "stateCode": 335,
    "name": "al-Muharraq",
    "countryCode": 17
  },
  {
    "stateCode": 336,
    "name": "ar-Rifa\\a, 17"
  },
  {
    "stateCode": 337,
    "name": "Bagar Hat",
    "countryCode": 18
  },
  {
    "stateCode": 338,
    "name": "Bandarban",
    "countryCode": 18
  },
  {
    "stateCode": 339,
    "name": "Barguna",
    "countryCode": 18
  },
  {
    "stateCode": 340,
    "name": "Barisal",
    "countryCode": 18
  },
  {
    "stateCode": 341,
    "name": "Bhola",
    "countryCode": 18
  },
  {
    "stateCode": 342,
    "name": "Bogora",
    "countryCode": 18
  },
  {
    "stateCode": 343,
    "name": "Brahman Bariya",
    "countryCode": 18
  },
  {
    "stateCode": 344,
    "name": "Chandpur",
    "countryCode": 18
  },
  {
    "stateCode": 345,
    "name": "Chattagam",
    "countryCode": 18
  },
  {
    "stateCode": 346,
    "name": "Chittagong Division",
    "countryCode": 18
  },
  {
    "stateCode": 347,
    "name": "Chuadanga",
    "countryCode": 18
  },
  {
    "stateCode": 348,
    "name": "Dhaka",
    "countryCode": 18
  },
  {
    "stateCode": 349,
    "name": "Dinajpur",
    "countryCode": 18
  },
  {
    "stateCode": 350,
    "name": "Faridpur",
    "countryCode": 18
  },
  {
    "stateCode": 351,
    "name": "Feni",
    "countryCode": 18
  },
  {
    "stateCode": 352,
    "name": "Gaybanda",
    "countryCode": 18
  },
  {
    "stateCode": 353,
    "name": "Gazipur",
    "countryCode": 18
  },
  {
    "stateCode": 354,
    "name": "Gopalganj",
    "countryCode": 18
  },
  {
    "stateCode": 355,
    "name": "Habiganj",
    "countryCode": 18
  },
  {
    "stateCode": 356,
    "name": "Jaipur Hat",
    "countryCode": 18
  },
  {
    "stateCode": 357,
    "name": "Jamalpur",
    "countryCode": 18
  },
  {
    "stateCode": 358,
    "name": "Jessor",
    "countryCode": 18
  },
  {
    "stateCode": 359,
    "name": "Jhalakati",
    "countryCode": 18
  },
  {
    "stateCode": 360,
    "name": "Jhanaydah",
    "countryCode": 18
  },
  {
    "stateCode": 361,
    "name": "Khagrachhari",
    "countryCode": 18
  },
  {
    "stateCode": 362,
    "name": "Khulna",
    "countryCode": 18
  },
  {
    "stateCode": 363,
    "name": "Kishorganj",
    "countryCode": 18
  },
  {
    "stateCode": 364,
    "name": "Koks Bazar",
    "countryCode": 18
  },
  {
    "stateCode": 365,
    "name": "Komilla",
    "countryCode": 18
  },
  {
    "stateCode": 366,
    "name": "Kurigram",
    "countryCode": 18
  },
  {
    "stateCode": 367,
    "name": "Kushtiya",
    "countryCode": 18
  },
  {
    "stateCode": 368,
    "name": "Lakshmipur",
    "countryCode": 18
  },
  {
    "stateCode": 369,
    "name": "Lalmanir Hat",
    "countryCode": 18
  },
  {
    "stateCode": 370,
    "name": "Madaripur",
    "countryCode": 18
  },
  {
    "stateCode": 371,
    "name": "Magura",
    "countryCode": 18
  },
  {
    "stateCode": 372,
    "name": "Maimansingh",
    "countryCode": 18
  },
  {
    "stateCode": 373,
    "name": "Manikganj",
    "countryCode": 18
  },
  {
    "stateCode": 374,
    "name": "Maulvi Bazar",
    "countryCode": 18
  },
  {
    "stateCode": 375,
    "name": "Meherpur",
    "countryCode": 18
  },
  {
    "stateCode": 376,
    "name": "Munshiganj",
    "countryCode": 18
  },
  {
    "stateCode": 377,
    "name": "Naral",
    "countryCode": 18
  },
  {
    "stateCode": 378,
    "name": "Narayanganj",
    "countryCode": 18
  },
  {
    "stateCode": 379,
    "name": "Narsingdi",
    "countryCode": 18
  },
  {
    "stateCode": 380,
    "name": "Nator",
    "countryCode": 18
  },
  {
    "stateCode": 381,
    "name": "Naugaon",
    "countryCode": 18
  },
  {
    "stateCode": 382,
    "name": "Nawabganj",
    "countryCode": 18
  },
  {
    "stateCode": 383,
    "name": "Netrakona",
    "countryCode": 18
  },
  {
    "stateCode": 384,
    "name": "Nilphamari",
    "countryCode": 18
  },
  {
    "stateCode": 385,
    "name": "Noakhali",
    "countryCode": 18
  },
  {
    "stateCode": 386,
    "name": "Pabna",
    "countryCode": 18
  },
  {
    "stateCode": 387,
    "name": "Panchagarh",
    "countryCode": 18
  },
  {
    "stateCode": 388,
    "name": "Patuakhali",
    "countryCode": 18
  },
  {
    "stateCode": 389,
    "name": "Pirojpur",
    "countryCode": 18
  },
  {
    "stateCode": 390,
    "name": "Rajbari",
    "countryCode": 18
  },
  {
    "stateCode": 391,
    "name": "Rajshahi",
    "countryCode": 18
  },
  {
    "stateCode": 392,
    "name": "Rangamati",
    "countryCode": 18
  },
  {
    "stateCode": 393,
    "name": "Rangpur",
    "countryCode": 18
  },
  {
    "stateCode": 394,
    "name": "Satkhira",
    "countryCode": 18
  },
  {
    "stateCode": 395,
    "name": "Shariatpur",
    "countryCode": 18
  },
  {
    "stateCode": 396,
    "name": "Sherpur",
    "countryCode": 18
  },
  {
    "stateCode": 397,
    "name": "Silhat",
    "countryCode": 18
  },
  {
    "stateCode": 398,
    "name": "Sirajganj",
    "countryCode": 18
  },
  {
    "stateCode": 399,
    "name": "Sunamganj",
    "countryCode": 18
  },
  {
    "stateCode": 400,
    "name": "Tangayal",
    "countryCode": 18
  },
  {
    "stateCode": 401,
    "name": "Thakurgaon",
    "countryCode": 18
  },
  {
    "stateCode": 402,
    "name": "Christ Church",
    "countryCode": 19
  },
  {
    "stateCode": 403,
    "name": "Saint Andrew",
    "countryCode": 19
  },
  {
    "stateCode": 404,
    "name": "Saint George",
    "countryCode": 19
  },
  {
    "stateCode": 405,
    "name": "Saint James",
    "countryCode": 19
  },
  {
    "stateCode": 406,
    "name": "Saint John",
    "countryCode": 19
  },
  {
    "stateCode": 407,
    "name": "Saint Joseph",
    "countryCode": 19
  },
  {
    "stateCode": 408,
    "name": "Saint Lucy",
    "countryCode": 19
  },
  {
    "stateCode": 409,
    "name": "Saint Michael",
    "countryCode": 19
  },
  {
    "stateCode": 410,
    "name": "Saint Peter",
    "countryCode": 19
  },
  {
    "stateCode": 411,
    "name": "Saint Philip",
    "countryCode": 19
  },
  {
    "stateCode": 412,
    "name": "Saint Thomas",
    "countryCode": 19
  },
  {
    "stateCode": 413,
    "name": "Brest",
    "countryCode": 20
  },
  {
    "stateCode": 414,
    "name": "Homjel\\', 20"
  },
  {
    "stateCode": 415,
    "name": "Hrodna",
    "countryCode": 20
  },
  {
    "stateCode": 416,
    "name": "Mahiljow",
    "countryCode": 20
  },
  {
    "stateCode": 417,
    "name": "Mahilyowskaya Voblasts",
    "countryCode": 20
  },
  {
    "stateCode": 418,
    "name": "Minsk",
    "countryCode": 20
  },
  {
    "stateCode": 419,
    "name": "Minskaja Voblasts\\', 20"
  },
  {
    "stateCode": 420,
    "name": "Petrik",
    "countryCode": 20
  },
  {
    "stateCode": 421,
    "name": "Vicebsk",
    "countryCode": 20
  },
  {
    "stateCode": 422,
    "name": "Antwerpen",
    "countryCode": 21
  },
  {
    "stateCode": 423,
    "name": "Berchem",
    "countryCode": 21
  },
  {
    "stateCode": 424,
    "name": "Brabant",
    "countryCode": 21
  },
  {
    "stateCode": 425,
    "name": "Brabant Wallon",
    "countryCode": 21
  },
  {
    "stateCode": 426,
    "name": "Brussel",
    "countryCode": 21
  },
  {
    "stateCode": 427,
    "name": "East Flanders",
    "countryCode": 21
  },
  {
    "stateCode": 428,
    "name": "Hainaut",
    "countryCode": 21
  },
  {
    "stateCode": 429,
    "name": "Liege",
    "countryCode": 21
  },
  {
    "stateCode": 430,
    "name": "Limburg",
    "countryCode": 21
  },
  {
    "stateCode": 431,
    "name": "Luxembourg",
    "countryCode": 21
  },
  {
    "stateCode": 432,
    "name": "Namur",
    "countryCode": 21
  },
  {
    "stateCode": 433,
    "name": "Ontario",
    "countryCode": 21
  },
  {
    "stateCode": 434,
    "name": "Oost-Vlaanderen",
    "countryCode": 21
  },
  {
    "stateCode": 435,
    "name": "Provincie Brabant",
    "countryCode": 21
  },
  {
    "stateCode": 436,
    "name": "Vlaams-Brabant",
    "countryCode": 21
  },
  {
    "stateCode": 437,
    "name": "Wallonne",
    "countryCode": 21
  },
  {
    "stateCode": 438,
    "name": "West-Vlaanderen",
    "countryCode": 21
  },
  {
    "stateCode": 439,
    "name": "Belize",
    "countryCode": 22
  },
  {
    "stateCode": 440,
    "name": "Cayo",
    "countryCode": 22
  },
  {
    "stateCode": 441,
    "name": "Corozal",
    "countryCode": 22
  },
  {
    "stateCode": 442,
    "name": "Orange Walk",
    "countryCode": 22
  },
  {
    "stateCode": 443,
    "name": "Stann Creek",
    "countryCode": 22
  },
  {
    "stateCode": 444,
    "name": "Toledo",
    "countryCode": 22
  },
  {
    "stateCode": 445,
    "name": "Alibori",
    "countryCode": 23
  },
  {
    "stateCode": 446,
    "name": "Atacora",
    "countryCode": 23
  },
  {
    "stateCode": 447,
    "name": "Atlantique",
    "countryCode": 23
  },
  {
    "stateCode": 448,
    "name": "Borgou",
    "countryCode": 23
  },
  {
    "stateCode": 449,
    "name": "Collines",
    "countryCode": 23
  },
  {
    "stateCode": 450,
    "name": "Couffo",
    "countryCode": 23
  },
  {
    "stateCode": 451,
    "name": "Donga",
    "countryCode": 23
  },
  {
    "stateCode": 452,
    "name": "Littoral",
    "countryCode": 23
  },
  {
    "stateCode": 453,
    "name": "Mono",
    "countryCode": 23
  },
  {
    "stateCode": 454,
    "name": "Oueme",
    "countryCode": 23
  },
  {
    "stateCode": 455,
    "name": "Plateau",
    "countryCode": 23
  },
  {
    "stateCode": 456,
    "name": "Zou",
    "countryCode": 23
  },
  {
    "stateCode": 457,
    "name": "Hamilton",
    "countryCode": 24
  },
  {
    "stateCode": 458,
    "name": "Saint George",
    "countryCode": 24
  },
  {
    "stateCode": 459,
    "name": "Bumthang",
    "countryCode": 25
  },
  {
    "stateCode": 460,
    "name": "Chhukha",
    "countryCode": 25
  },
  {
    "stateCode": 461,
    "name": "Chirang",
    "countryCode": 25
  },
  {
    "stateCode": 462,
    "name": "Daga",
    "countryCode": 25
  },
  {
    "stateCode": 463,
    "name": "Geylegphug",
    "countryCode": 25
  },
  {
    "stateCode": 464,
    "name": "Ha",
    "countryCode": 25
  },
  {
    "stateCode": 465,
    "name": "Lhuntshi",
    "countryCode": 25
  },
  {
    "stateCode": 466,
    "name": "Mongar",
    "countryCode": 25
  },
  {
    "stateCode": 467,
    "name": "Pemagatsel",
    "countryCode": 25
  },
  {
    "stateCode": 468,
    "name": "Punakha",
    "countryCode": 25
  },
  {
    "stateCode": 469,
    "name": "Rinpung",
    "countryCode": 25
  },
  {
    "stateCode": 470,
    "name": "Samchi",
    "countryCode": 25
  },
  {
    "stateCode": 471,
    "name": "Samdrup Jongkhar",
    "countryCode": 25
  },
  {
    "stateCode": 472,
    "name": "Shemgang",
    "countryCode": 25
  },
  {
    "stateCode": 473,
    "name": "Tashigang",
    "countryCode": 25
  },
  {
    "stateCode": 474,
    "name": "Timphu",
    "countryCode": 25
  },
  {
    "stateCode": 475,
    "name": "Tongsa",
    "countryCode": 25
  },
  {
    "stateCode": 476,
    "name": "Wangdiphodrang",
    "countryCode": 25
  },
  {
    "stateCode": 477,
    "name": "Beni",
    "countryCode": 26
  },
  {
    "stateCode": 478,
    "name": "Chuquisaca",
    "countryCode": 26
  },
  {
    "stateCode": 479,
    "name": "Cochabamba",
    "countryCode": 26
  },
  {
    "stateCode": 480,
    "name": "La Paz",
    "countryCode": 26
  },
  {
    "stateCode": 481,
    "name": "Oruro",
    "countryCode": 26
  },
  {
    "stateCode": 482,
    "name": "Pando",
    "countryCode": 26
  },
  {
    "stateCode": 483,
    "name": "Potosi",
    "countryCode": 26
  },
  {
    "stateCode": 484,
    "name": "Santa Cruz",
    "countryCode": 26
  },
  {
    "stateCode": 485,
    "name": "Tarija",
    "countryCode": 26
  },
  {
    "stateCode": 486,
    "name": "Federacija Bosna i Hercegovina",
    "countryCode": 27
  },
  {
    "stateCode": 487,
    "name": "Republika Srpska",
    "countryCode": 27
  },
  {
    "stateCode": 488,
    "name": "Central Bobonong",
    "countryCode": 28
  },
  {
    "stateCode": 489,
    "name": "Central Boteti",
    "countryCode": 28
  },
  {
    "stateCode": 490,
    "name": "Central Mahalapye",
    "countryCode": 28
  },
  {
    "stateCode": 491,
    "name": "Central Serowe-Palapye",
    "countryCode": 28
  },
  {
    "stateCode": 492,
    "name": "Central Tutume",
    "countryCode": 28
  },
  {
    "stateCode": 493,
    "name": "Chobe",
    "countryCode": 28
  },
  {
    "stateCode": 494,
    "name": "Francistown",
    "countryCode": 28
  },
  {
    "stateCode": 495,
    "name": "Gaborone",
    "countryCode": 28
  },
  {
    "stateCode": 496,
    "name": "Ghanzi",
    "countryCode": 28
  },
  {
    "stateCode": 497,
    "name": "Jwaneng",
    "countryCode": 28
  },
  {
    "stateCode": 498,
    "name": "Kgalagadi North",
    "countryCode": 28
  },
  {
    "stateCode": 499,
    "name": "Kgalagadi South",
    "countryCode": 28
  },
  {
    "stateCode": 500,
    "name": "Kgatleng",
    "countryCode": 28
  },
  {
    "stateCode": 501,
    "name": "Kweneng",
    "countryCode": 28
  },
  {
    "stateCode": 502,
    "name": "Lobatse",
    "countryCode": 28
  },
  {
    "stateCode": 503,
    "name": "Ngamiland",
    "countryCode": 28
  },
  {
    "stateCode": 504,
    "name": "Ngwaketse",
    "countryCode": 28
  },
  {
    "stateCode": 505,
    "name": "North East",
    "countryCode": 28
  },
  {
    "stateCode": 506,
    "name": "Okavango",
    "countryCode": 28
  },
  {
    "stateCode": 507,
    "name": "Orapa",
    "countryCode": 28
  },
  {
    "stateCode": 508,
    "name": "Selibe Phikwe",
    "countryCode": 28
  },
  {
    "stateCode": 509,
    "name": "South East",
    "countryCode": 28
  },
  {
    "stateCode": 510,
    "name": "Sowa",
    "countryCode": 28
  },
  {
    "stateCode": 511,
    "name": "Bouvet Island",
    "countryCode": 29
  },
  {
    "stateCode": 512,
    "name": "Acre",
    "countryCode": 30
  },
  {
    "stateCode": 513,
    "name": "Alagoas",
    "countryCode": 30
  },
  {
    "stateCode": 514,
    "name": "Amapa",
    "countryCode": 30
  },
  {
    "stateCode": 515,
    "name": "Amazonas",
    "countryCode": 30
  },
  {
    "stateCode": 516,
    "name": "Bahia",
    "countryCode": 30
  },
  {
    "stateCode": 517,
    "name": "Ceara",
    "countryCode": 30
  },
  {
    "stateCode": 518,
    "name": "Distrito Federal",
    "countryCode": 30
  },
  {
    "stateCode": 519,
    "name": "Espirito Santo",
    "countryCode": 30
  },
  {
    "stateCode": 520,
    "name": "Estado de Sao Paulo",
    "countryCode": 30
  },
  {
    "stateCode": 521,
    "name": "Goias",
    "countryCode": 30
  },
  {
    "stateCode": 522,
    "name": "Maranhao",
    "countryCode": 30
  },
  {
    "stateCode": 523,
    "name": "Mato Grosso",
    "countryCode": 30
  },
  {
    "stateCode": 524,
    "name": "Mato Grosso do Sul",
    "countryCode": 30
  },
  {
    "stateCode": 525,
    "name": "Minas Gerais",
    "countryCode": 30
  },
  {
    "stateCode": 526,
    "name": "Para",
    "countryCode": 30
  },
  {
    "stateCode": 527,
    "name": "Paraiba",
    "countryCode": 30
  },
  {
    "stateCode": 528,
    "name": "Parana",
    "countryCode": 30
  },
  {
    "stateCode": 529,
    "name": "Pernambuco",
    "countryCode": 30
  },
  {
    "stateCode": 530,
    "name": "Piaui",
    "countryCode": 30
  },
  {
    "stateCode": 531,
    "name": "Rio Grande do Norte",
    "countryCode": 30
  },
  {
    "stateCode": 532,
    "name": "Rio Grande do Sul",
    "countryCode": 30
  },
  {
    "stateCode": 533,
    "name": "Rio de Janeiro",
    "countryCode": 30
  },
  {
    "stateCode": 534,
    "name": "Rondonia",
    "countryCode": 30
  },
  {
    "stateCode": 535,
    "name": "Roraima",
    "countryCode": 30
  },
  {
    "stateCode": 536,
    "name": "Santa Catarina",
    "countryCode": 30
  },
  {
    "stateCode": 537,
    "name": "Sao Paulo",
    "countryCode": 30
  },
  {
    "stateCode": 538,
    "name": "Sergipe",
    "countryCode": 30
  },
  {
    "stateCode": 539,
    "name": "Tocantins",
    "countryCode": 30
  },
  {
    "stateCode": 540,
    "name": "British Indian Ocean Territory",
    "countryCode": 31
  },
  {
    "stateCode": 541,
    "name": "Belait",
    "countryCode": 32
  },
  {
    "stateCode": 542,
    "name": "Brunei-Muara",
    "countryCode": 32
  },
  {
    "stateCode": 543,
    "name": "Temburong",
    "countryCode": 32
  },
  {
    "stateCode": 544,
    "name": "Tutong",
    "countryCode": 32
  },
  {
    "stateCode": 545,
    "name": "Blagoevgrad",
    "countryCode": 33
  },
  {
    "stateCode": 546,
    "name": "Burgas",
    "countryCode": 33
  },
  {
    "stateCode": 547,
    "name": "Dobrich",
    "countryCode": 33
  },
  {
    "stateCode": 548,
    "name": "Gabrovo",
    "countryCode": 33
  },
  {
    "stateCode": 549,
    "name": "Haskovo",
    "countryCode": 33
  },
  {
    "stateCode": 550,
    "name": "Jambol",
    "countryCode": 33
  },
  {
    "stateCode": 551,
    "name": "Kardzhali",
    "countryCode": 33
  },
  {
    "stateCode": 552,
    "name": "Kjustendil",
    "countryCode": 33
  },
  {
    "stateCode": 553,
    "name": "Lovech",
    "countryCode": 33
  },
  {
    "stateCode": 554,
    "name": "Montana",
    "countryCode": 33
  },
  {
    "stateCode": 555,
    "name": "Oblast Sofiya-Grad",
    "countryCode": 33
  },
  {
    "stateCode": 556,
    "name": "Pazardzhik",
    "countryCode": 33
  },
  {
    "stateCode": 557,
    "name": "Pernik",
    "countryCode": 33
  },
  {
    "stateCode": 558,
    "name": "Pleven",
    "countryCode": 33
  },
  {
    "stateCode": 559,
    "name": "Plovdiv",
    "countryCode": 33
  },
  {
    "stateCode": 560,
    "name": "Razgrad",
    "countryCode": 33
  },
  {
    "stateCode": 561,
    "name": "Ruse",
    "countryCode": 33
  },
  {
    "stateCode": 562,
    "name": "Shumen",
    "countryCode": 33
  },
  {
    "stateCode": 563,
    "name": "Silistra",
    "countryCode": 33
  },
  {
    "stateCode": 564,
    "name": "Sliven",
    "countryCode": 33
  },
  {
    "stateCode": 565,
    "name": "Smoljan",
    "countryCode": 33
  },
  {
    "stateCode": 566,
    "name": "Sofija grad",
    "countryCode": 33
  },
  {
    "stateCode": 567,
    "name": "Sofijska oblast",
    "countryCode": 33
  },
  {
    "stateCode": 568,
    "name": "Stara Zagora",
    "countryCode": 33
  },
  {
    "stateCode": 569,
    "name": "Targovishte",
    "countryCode": 33
  },
  {
    "stateCode": 570,
    "name": "Varna",
    "countryCode": 33
  },
  {
    "stateCode": 571,
    "name": "Veliko Tarnovo",
    "countryCode": 33
  },
  {
    "stateCode": 572,
    "name": "Vidin",
    "countryCode": 33
  },
  {
    "stateCode": 573,
    "name": "Vraca",
    "countryCode": 33
  },
  {
    "stateCode": 574,
    "name": "Yablaniza",
    "countryCode": 33
  },
  {
    "stateCode": 575,
    "name": "Bale",
    "countryCode": 34
  },
  {
    "stateCode": 576,
    "name": "Bam",
    "countryCode": 34
  },
  {
    "stateCode": 577,
    "name": "Bazega",
    "countryCode": 34
  },
  {
    "stateCode": 578,
    "name": "Bougouriba",
    "countryCode": 34
  },
  {
    "stateCode": 579,
    "name": "Boulgou",
    "countryCode": 34
  },
  {
    "stateCode": 580,
    "name": "Boulkiemde",
    "countryCode": 34
  },
  {
    "stateCode": 581,
    "name": "Comoe",
    "countryCode": 34
  },
  {
    "stateCode": 582,
    "name": "Ganzourgou",
    "countryCode": 34
  },
  {
    "stateCode": 583,
    "name": "Gnagna",
    "countryCode": 34
  },
  {
    "stateCode": 584,
    "name": "Gourma",
    "countryCode": 34
  },
  {
    "stateCode": 585,
    "name": "Houet",
    "countryCode": 34
  },
  {
    "stateCode": 586,
    "name": "Ioba",
    "countryCode": 34
  },
  {
    "stateCode": 587,
    "name": "Kadiogo",
    "countryCode": 34
  },
  {
    "stateCode": 588,
    "name": "Kenedougou",
    "countryCode": 34
  },
  {
    "stateCode": 589,
    "name": "Komandjari",
    "countryCode": 34
  },
  {
    "stateCode": 590,
    "name": "Kompienga",
    "countryCode": 34
  },
  {
    "stateCode": 591,
    "name": "Kossi",
    "countryCode": 34
  },
  {
    "stateCode": 592,
    "name": "Kouritenga",
    "countryCode": 34
  },
  {
    "stateCode": 593,
    "name": "Kourweogo",
    "countryCode": 34
  },
  {
    "stateCode": 594,
    "name": "Leraba",
    "countryCode": 34
  },
  {
    "stateCode": 595,
    "name": "Mouhoun",
    "countryCode": 34
  },
  {
    "stateCode": 596,
    "name": "Nahouri",
    "countryCode": 34
  },
  {
    "stateCode": 597,
    "name": "Namentenga",
    "countryCode": 34
  },
  {
    "stateCode": 598,
    "name": "Noumbiel",
    "countryCode": 34
  },
  {
    "stateCode": 599,
    "name": "Oubritenga",
    "countryCode": 34
  },
  {
    "stateCode": 600,
    "name": "Oudalan",
    "countryCode": 34
  },
  {
    "stateCode": 601,
    "name": "Passore",
    "countryCode": 34
  },
  {
    "stateCode": 602,
    "name": "Poni",
    "countryCode": 34
  },
  {
    "stateCode": 603,
    "name": "Sanguie",
    "countryCode": 34
  },
  {
    "stateCode": 604,
    "name": "Sanmatenga",
    "countryCode": 34
  },
  {
    "stateCode": 605,
    "name": "Seno",
    "countryCode": 34
  },
  {
    "stateCode": 606,
    "name": "Sissili",
    "countryCode": 34
  },
  {
    "stateCode": 607,
    "name": "Soum",
    "countryCode": 34
  },
  {
    "stateCode": 608,
    "name": "Sourou",
    "countryCode": 34
  },
  {
    "stateCode": 609,
    "name": "Tapoa",
    "countryCode": 34
  },
  {
    "stateCode": 610,
    "name": "Tuy",
    "countryCode": 34
  },
  {
    "stateCode": 611,
    "name": "Yatenga",
    "countryCode": 34
  },
  {
    "stateCode": 612,
    "name": "Zondoma",
    "countryCode": 34
  },
  {
    "stateCode": 613,
    "name": "Zoundweogo",
    "countryCode": 34
  },
  {
    "stateCode": 614,
    "name": "Bubanza",
    "countryCode": 35
  },
  {
    "stateCode": 615,
    "name": "Bujumbura",
    "countryCode": 35
  },
  {
    "stateCode": 616,
    "name": "Bururi",
    "countryCode": 35
  },
  {
    "stateCode": 617,
    "name": "Cankuzo",
    "countryCode": 35
  },
  {
    "stateCode": 618,
    "name": "Cibitoke",
    "countryCode": 35
  },
  {
    "stateCode": 619,
    "name": "Gitega",
    "countryCode": 35
  },
  {
    "stateCode": 620,
    "name": "Karuzi",
    "countryCode": 35
  },
  {
    "stateCode": 621,
    "name": "Kayanza",
    "countryCode": 35
  },
  {
    "stateCode": 622,
    "name": "Kirundo",
    "countryCode": 35
  },
  {
    "stateCode": 623,
    "name": "Makamba",
    "countryCode": 35
  },
  {
    "stateCode": 624,
    "name": "Muramvya",
    "countryCode": 35
  },
  {
    "stateCode": 625,
    "name": "Muyinga",
    "countryCode": 35
  },
  {
    "stateCode": 626,
    "name": "Ngozi",
    "countryCode": 35
  },
  {
    "stateCode": 627,
    "name": "Rutana",
    "countryCode": 35
  },
  {
    "stateCode": 628,
    "name": "Ruyigi",
    "countryCode": 35
  },
  {
    "stateCode": 629,
    "name": "Banteay Mean Chey",
    "countryCode": 36
  },
  {
    "stateCode": 630,
    "name": "Bat Dambang",
    "countryCode": 36
  },
  {
    "stateCode": 631,
    "name": "Kampong Cham",
    "countryCode": 36
  },
  {
    "stateCode": 632,
    "name": "Kampong Chhnang",
    "countryCode": 36
  },
  {
    "stateCode": 633,
    "name": "Kampong Spoeu",
    "countryCode": 36
  },
  {
    "stateCode": 634,
    "name": "Kampong Thum",
    "countryCode": 36
  },
  {
    "stateCode": 635,
    "name": "Kampot",
    "countryCode": 36
  },
  {
    "stateCode": 636,
    "name": "Kandal",
    "countryCode": 36
  },
  {
    "stateCode": 637,
    "name": "Kaoh Kong",
    "countryCode": 36
  },
  {
    "stateCode": 638,
    "name": "Kracheh",
    "countryCode": 36
  },
  {
    "stateCode": 639,
    "name": "Krong Kaeb",
    "countryCode": 36
  },
  {
    "stateCode": 640,
    "name": "Krong Pailin",
    "countryCode": 36
  },
  {
    "stateCode": 641,
    "name": "Krong Preah Sihanouk",
    "countryCode": 36
  },
  {
    "stateCode": 642,
    "name": "Mondol Kiri",
    "countryCode": 36
  },
  {
    "stateCode": 643,
    "name": "Otdar Mean Chey",
    "countryCode": 36
  },
  {
    "stateCode": 644,
    "name": "Phnum Penh",
    "countryCode": 36
  },
  {
    "stateCode": 645,
    "name": "Pousat",
    "countryCode": 36
  },
  {
    "stateCode": 646,
    "name": "Preah Vihear",
    "countryCode": 36
  },
  {
    "stateCode": 647,
    "name": "Prey Veaeng",
    "countryCode": 36
  },
  {
    "stateCode": 648,
    "name": "Rotanak Kiri",
    "countryCode": 36
  },
  {
    "stateCode": 649,
    "name": "Siem Reab",
    "countryCode": 36
  },
  {
    "stateCode": 650,
    "name": "Stueng Traeng",
    "countryCode": 36
  },
  {
    "stateCode": 651,
    "name": "Svay Rieng",
    "countryCode": 36
  },
  {
    "stateCode": 652,
    "name": "Takaev",
    "countryCode": 36
  },
  {
    "stateCode": 653,
    "name": "Adamaoua",
    "countryCode": 37
  },
  {
    "stateCode": 654,
    "name": "Centre",
    "countryCode": 37
  },
  {
    "stateCode": 655,
    "name": "Est",
    "countryCode": 37
  },
  {
    "stateCode": 656,
    "name": "Littoral",
    "countryCode": 37
  },
  {
    "stateCode": 657,
    "name": "Nord",
    "countryCode": 37
  },
  {
    "stateCode": 658,
    "name": "Nord Extreme",
    "countryCode": 37
  },
  {
    "stateCode": 659,
    "name": "Nordouest",
    "countryCode": 37
  },
  {
    "stateCode": 660,
    "name": "Ouest",
    "countryCode": 37
  },
  {
    "stateCode": 661,
    "name": "Sud",
    "countryCode": 37
  },
  {
    "stateCode": 662,
    "name": "Sudouest",
    "countryCode": 37
  },
  {
    "stateCode": 663,
    "name": "Alberta",
    "countryCode": 38
  },
  {
    "stateCode": 664,
    "name": "British Columbia",
    "countryCode": 38
  },
  {
    "stateCode": 665,
    "name": "Manitoba",
    "countryCode": 38
  },
  {
    "stateCode": 666,
    "name": "New Brunswick",
    "countryCode": 38
  },
  {
    "stateCode": 667,
    "name": "Newfoundland and Labrador",
    "countryCode": 38
  },
  {
    "stateCode": 668,
    "name": "Northwest Territories",
    "countryCode": 38
  },
  {
    "stateCode": 669,
    "name": "Nova Scotia",
    "countryCode": 38
  },
  {
    "stateCode": 670,
    "name": "Nunavut",
    "countryCode": 38
  },
  {
    "stateCode": 671,
    "name": "Ontario",
    "countryCode": 38
  },
  {
    "stateCode": 672,
    "name": "Prince Edward Island",
    "countryCode": 38
  },
  {
    "stateCode": 673,
    "name": "Quebec",
    "countryCode": 38
  },
  {
    "stateCode": 674,
    "name": "Saskatchewan",
    "countryCode": 38
  },
  {
    "stateCode": 675,
    "name": "Yukon",
    "countryCode": 38
  },
  {
    "stateCode": 676,
    "name": "Boavista",
    "countryCode": 39
  },
  {
    "stateCode": 677,
    "name": "Brava",
    "countryCode": 39
  },
  {
    "stateCode": 678,
    "name": "Fogo",
    "countryCode": 39
  },
  {
    "stateCode": 679,
    "name": "Maio",
    "countryCode": 39
  },
  {
    "stateCode": 680,
    "name": "Sal",
    "countryCode": 39
  },
  {
    "stateCode": 681,
    "name": "Santo Antao",
    "countryCode": 39
  },
  {
    "stateCode": 682,
    "name": "Sao Nicolau",
    "countryCode": 39
  },
  {
    "stateCode": 683,
    "name": "Sao Tiago",
    "countryCode": 39
  },
  {
    "stateCode": 684,
    "name": "Sao Vicente",
    "countryCode": 39
  },
  {
    "stateCode": 685,
    "name": "Grand Cayman",
    "countryCode": 40
  },
  {
    "stateCode": 686,
    "name": "Bamingui-Bangoran",
    "countryCode": 41
  },
  {
    "stateCode": 687,
    "name": "Bangui",
    "countryCode": 41
  },
  {
    "stateCode": 688,
    "name": "Basse-Kotto",
    "countryCode": 41
  },
  {
    "stateCode": 689,
    "name": "Haut-Mbomou",
    "countryCode": 41
  },
  {
    "stateCode": 690,
    "name": "Haute-Kotto",
    "countryCode": 41
  },
  {
    "stateCode": 691,
    "name": "Kemo",
    "countryCode": 41
  },
  {
    "stateCode": 692,
    "name": "Lobaye",
    "countryCode": 41
  },
  {
    "stateCode": 693,
    "name": "Mambere-Kadei",
    "countryCode": 41
  },
  {
    "stateCode": 694,
    "name": "Mbomou",
    "countryCode": 41
  },
  {
    "stateCode": 695,
    "name": "Nana-Gribizi",
    "countryCode": 41
  },
  {
    "stateCode": 696,
    "name": "Nana-Mambere",
    "countryCode": 41
  },
  {
    "stateCode": 697,
    "name": "Ombella Mpoko",
    "countryCode": 41
  },
  {
    "stateCode": 698,
    "name": "Ouaka",
    "countryCode": 41
  },
  {
    "stateCode": 699,
    "name": "Ouham",
    "countryCode": 41
  },
  {
    "stateCode": 700,
    "name": "Ouham-Pende",
    "countryCode": 41
  },
  {
    "stateCode": 701,
    "name": "Sangha-Mbaere",
    "countryCode": 41
  },
  {
    "stateCode": 702,
    "name": "Vakaga",
    "countryCode": 41
  },
  {
    "stateCode": 703,
    "name": "Batha",
    "countryCode": 42
  },
  {
    "stateCode": 704,
    "name": "Biltine",
    "countryCode": 42
  },
  {
    "stateCode": 705,
    "name": "Bourkou-Ennedi-Tibesti",
    "countryCode": 42
  },
  {
    "stateCode": 706,
    "name": "Chari-Baguirmi",
    "countryCode": 42
  },
  {
    "stateCode": 707,
    "name": "Guera",
    "countryCode": 42
  },
  {
    "stateCode": 708,
    "name": "Kanem",
    "countryCode": 42
  },
  {
    "stateCode": 709,
    "name": "Lac",
    "countryCode": 42
  },
  {
    "stateCode": 710,
    "name": "Logone Occidental",
    "countryCode": 42
  },
  {
    "stateCode": 711,
    "name": "Logone Oriental",
    "countryCode": 42
  },
  {
    "stateCode": 712,
    "name": "Mayo-Kebbi",
    "countryCode": 42
  },
  {
    "stateCode": 713,
    "name": "Moyen-Chari",
    "countryCode": 42
  },
  {
    "stateCode": 714,
    "name": "Ouaddai",
    "countryCode": 42
  },
  {
    "stateCode": 715,
    "name": "Salamat",
    "countryCode": 42
  },
  {
    "stateCode": 716,
    "name": "Tandjile",
    "countryCode": 42
  },
  {
    "stateCode": 717,
    "name": "Aisen",
    "countryCode": 43
  },
  {
    "stateCode": 718,
    "name": "Antofagasta",
    "countryCode": 43
  },
  {
    "stateCode": 719,
    "name": "Araucania",
    "countryCode": 43
  },
  {
    "stateCode": 720,
    "name": "Atacama",
    "countryCode": 43
  },
  {
    "stateCode": 721,
    "name": "Bio Bio",
    "countryCode": 43
  },
  {
    "stateCode": 722,
    "name": "Coquimbo",
    "countryCode": 43
  },
  {
    "stateCode": 723,
    "name": "Libertador General Bernardo O\\', 43"
  },
  {
    "stateCode": 724,
    "name": "Los Lagos",
    "countryCode": 43
  },
  {
    "stateCode": 725,
    "name": "Magellanes",
    "countryCode": 43
  },
  {
    "stateCode": 726,
    "name": "Maule",
    "countryCode": 43
  },
  {
    "stateCode": 727,
    "name": "Metropolitana",
    "countryCode": 43
  },
  {
    "stateCode": 728,
    "name": "Metropolitana de Santiago",
    "countryCode": 43
  },
  {
    "stateCode": 729,
    "name": "Tarapaca",
    "countryCode": 43
  },
  {
    "stateCode": 730,
    "name": "Valparaiso",
    "countryCode": 43
  },
  {
    "stateCode": 731,
    "name": "Anhui",
    "countryCode": 44
  },
  {
    "stateCode": 732,
    "name": "Anhui Province",
    "countryCode": 44
  },
  {
    "stateCode": 733,
    "name": "Anhui Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 734,
    "name": "Aomen",
    "countryCode": 44
  },
  {
    "stateCode": 735,
    "name": "Beijing",
    "countryCode": 44
  },
  {
    "stateCode": 736,
    "name": "Beijing Shi",
    "countryCode": 44
  },
  {
    "stateCode": 737,
    "name": "Chongqing",
    "countryCode": 44
  },
  {
    "stateCode": 738,
    "name": "Fujian",
    "countryCode": 44
  },
  {
    "stateCode": 739,
    "name": "Fujian Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 740,
    "name": "Gansu",
    "countryCode": 44
  },
  {
    "stateCode": 741,
    "name": "Guangdong",
    "countryCode": 44
  },
  {
    "stateCode": 742,
    "name": "Guangdong Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 743,
    "name": "Guangxi",
    "countryCode": 44
  },
  {
    "stateCode": 744,
    "name": "Guizhou",
    "countryCode": 44
  },
  {
    "stateCode": 745,
    "name": "Hainan",
    "countryCode": 44
  },
  {
    "stateCode": 746,
    "name": "Hebei",
    "countryCode": 44
  },
  {
    "stateCode": 747,
    "name": "Heilongjiang",
    "countryCode": 44
  },
  {
    "stateCode": 748,
    "name": "Henan",
    "countryCode": 44
  },
  {
    "stateCode": 749,
    "name": "Hubei",
    "countryCode": 44
  },
  {
    "stateCode": 750,
    "name": "Hunan",
    "countryCode": 44
  },
  {
    "stateCode": 751,
    "name": "Jiangsu",
    "countryCode": 44
  },
  {
    "stateCode": 752,
    "name": "Jiangsu Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 753,
    "name": "Jiangxi",
    "countryCode": 44
  },
  {
    "stateCode": 754,
    "name": "Jilin",
    "countryCode": 44
  },
  {
    "stateCode": 755,
    "name": "Liaoning",
    "countryCode": 44
  },
  {
    "stateCode": 756,
    "name": "Liaoning Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 757,
    "name": "Nei Monggol",
    "countryCode": 44
  },
  {
    "stateCode": 758,
    "name": "Ningxia Hui",
    "countryCode": 44
  },
  {
    "stateCode": 759,
    "name": "Qinghai",
    "countryCode": 44
  },
  {
    "stateCode": 760,
    "name": "Shaanxi",
    "countryCode": 44
  },
  {
    "stateCode": 761,
    "name": "Shandong",
    "countryCode": 44
  },
  {
    "stateCode": 762,
    "name": "Shandong Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 763,
    "name": "Shanghai",
    "countryCode": 44
  },
  {
    "stateCode": 764,
    "name": "Shanxi",
    "countryCode": 44
  },
  {
    "stateCode": 765,
    "name": "Sichuan",
    "countryCode": 44
  },
  {
    "stateCode": 766,
    "name": "Tianjin",
    "countryCode": 44
  },
  {
    "stateCode": 767,
    "name": "Xianggang",
    "countryCode": 44
  },
  {
    "stateCode": 768,
    "name": "Xinjiang",
    "countryCode": 44
  },
  {
    "stateCode": 769,
    "name": "Xizang",
    "countryCode": 44
  },
  {
    "stateCode": 770,
    "name": "Yunnan",
    "countryCode": 44
  },
  {
    "stateCode": 771,
    "name": "Zhejiang",
    "countryCode": 44
  },
  {
    "stateCode": 772,
    "name": "Zhejiang Sheng",
    "countryCode": 44
  },
  {
    "stateCode": 773,
    "name": "Christmas Island",
    "countryCode": 45
  },
  {
    "stateCode": 774,
    "name": "Cocos (Keeling"
  },
  {
    "stateCode": 775,
    "name": "Amazonas",
    "countryCode": 47
  },
  {
    "stateCode": 776,
    "name": "Antioquia",
    "countryCode": 47
  },
  {
    "stateCode": 777,
    "name": "Arauca",
    "countryCode": 47
  },
  {
    "stateCode": 778,
    "name": "Atlantico",
    "countryCode": 47
  },
  {
    "stateCode": 779,
    "name": "Bogota",
    "countryCode": 47
  },
  {
    "stateCode": 780,
    "name": "Bolivar",
    "countryCode": 47
  },
  {
    "stateCode": 781,
    "name": "Boyaca",
    "countryCode": 47
  },
  {
    "stateCode": 782,
    "name": "Caldas",
    "countryCode": 47
  },
  {
    "stateCode": 783,
    "name": "Caqueta",
    "countryCode": 47
  },
  {
    "stateCode": 784,
    "name": "Casanare",
    "countryCode": 47
  },
  {
    "stateCode": 785,
    "name": "Cauca",
    "countryCode": 47
  },
  {
    "stateCode": 786,
    "name": "Cesar",
    "countryCode": 47
  },
  {
    "stateCode": 787,
    "name": "Choco",
    "countryCode": 47
  },
  {
    "stateCode": 788,
    "name": "Cordoba",
    "countryCode": 47
  },
  {
    "stateCode": 789,
    "name": "Cundinamarca",
    "countryCode": 47
  },
  {
    "stateCode": 790,
    "name": "Guainia",
    "countryCode": 47
  },
  {
    "stateCode": 791,
    "name": "Guaviare",
    "countryCode": 47
  },
  {
    "stateCode": 792,
    "name": "Huila",
    "countryCode": 47
  },
  {
    "stateCode": 793,
    "name": "La Guajira",
    "countryCode": 47
  },
  {
    "stateCode": 794,
    "name": "Magdalena",
    "countryCode": 47
  },
  {
    "stateCode": 795,
    "name": "Meta",
    "countryCode": 47
  },
  {
    "stateCode": 796,
    "name": "Narino",
    "countryCode": 47
  },
  {
    "stateCode": 797,
    "name": "Norte de Santander",
    "countryCode": 47
  },
  {
    "stateCode": 798,
    "name": "Putumayo",
    "countryCode": 47
  },
  {
    "stateCode": 799,
    "name": "Quindio",
    "countryCode": 47
  },
  {
    "stateCode": 800,
    "name": "Risaralda",
    "countryCode": 47
  },
  {
    "stateCode": 801,
    "name": "San Andres y Providencia",
    "countryCode": 47
  },
  {
    "stateCode": 802,
    "name": "Santander",
    "countryCode": 47
  },
  {
    "stateCode": 803,
    "name": "Sucre",
    "countryCode": 47
  },
  {
    "stateCode": 804,
    "name": "Tolima",
    "countryCode": 47
  },
  {
    "stateCode": 805,
    "name": "Valle del Cauca",
    "countryCode": 47
  },
  {
    "stateCode": 806,
    "name": "Vaupes",
    "countryCode": 47
  },
  {
    "stateCode": 807,
    "name": "Vichada",
    "countryCode": 47
  },
  {
    "stateCode": 808,
    "name": "Mwali",
    "countryCode": 48
  },
  {
    "stateCode": 809,
    "name": "Njazidja",
    "countryCode": 48
  },
  {
    "stateCode": 810,
    "name": "Nzwani",
    "countryCode": 48
  },
  {
    "stateCode": 811,
    "name": "Bouenza",
    "countryCode": 49
  },
  {
    "stateCode": 812,
    "name": "Brazzaville",
    "countryCode": 49
  },
  {
    "stateCode": 813,
    "name": "Cuvette",
    "countryCode": 49
  },
  {
    "stateCode": 814,
    "name": "Kouilou",
    "countryCode": 49
  },
  {
    "stateCode": 815,
    "name": "Lekoumou",
    "countryCode": 49
  },
  {
    "stateCode": 816,
    "name": "Likouala",
    "countryCode": 49
  },
  {
    "stateCode": 817,
    "name": "Niari",
    "countryCode": 49
  },
  {
    "stateCode": 818,
    "name": "Plateaux",
    "countryCode": 49
  },
  {
    "stateCode": 819,
    "name": "Pool",
    "countryCode": 49
  },
  {
    "stateCode": 820,
    "name": "Sangha",
    "countryCode": 49
  },
  {
    "stateCode": 821,
    "name": "Bandundu",
    "countryCode": 50
  },
  {
    "stateCode": 822,
    "name": "Bas-Congo",
    "countryCode": 50
  },
  {
    "stateCode": 823,
    "name": "Equateur",
    "countryCode": 50
  },
  {
    "stateCode": 824,
    "name": "Haut-Congo",
    "countryCode": 50
  },
  {
    "stateCode": 825,
    "name": "Kasai-Occidental",
    "countryCode": 50
  },
  {
    "stateCode": 826,
    "name": "Kasai-Oriental",
    "countryCode": 50
  },
  {
    "stateCode": 827,
    "name": "Katanga",
    "countryCode": 50
  },
  {
    "stateCode": 828,
    "name": "Kinshasa",
    "countryCode": 50
  },
  {
    "stateCode": 829,
    "name": "Maniema",
    "countryCode": 50
  },
  {
    "stateCode": 830,
    "name": "Nord-Kivu",
    "countryCode": 50
  },
  {
    "stateCode": 831,
    "name": "Sud-Kivu",
    "countryCode": 50
  },
  {
    "stateCode": 832,
    "name": "Aitutaki",
    "countryCode": 51
  },
  {
    "stateCode": 833,
    "name": "Atiu",
    "countryCode": 51
  },
  {
    "stateCode": 834,
    "name": "Mangaia",
    "countryCode": 51
  },
  {
    "stateCode": 835,
    "name": "Manihiki",
    "countryCode": 51
  },
  {
    "stateCode": 836,
    "name": "Mauke",
    "countryCode": 51
  },
  {
    "stateCode": 837,
    "name": "Mitiaro",
    "countryCode": 51
  },
  {
    "stateCode": 838,
    "name": "Nassau",
    "countryCode": 51
  },
  {
    "stateCode": 839,
    "name": "Pukapuka",
    "countryCode": 51
  },
  {
    "stateCode": 840,
    "name": "Rakahanga",
    "countryCode": 51
  },
  {
    "stateCode": 841,
    "name": "Rarotonga",
    "countryCode": 51
  },
  {
    "stateCode": 842,
    "name": "Tongareva",
    "countryCode": 51
  },
  {
    "stateCode": 843,
    "name": "Alajuela",
    "countryCode": 52
  },
  {
    "stateCode": 844,
    "name": "Cartago",
    "countryCode": 52
  },
  {
    "stateCode": 845,
    "name": "Guanacaste",
    "countryCode": 52
  },
  {
    "stateCode": 846,
    "name": "Heredia",
    "countryCode": 52
  },
  {
    "stateCode": 847,
    "name": "Limon",
    "countryCode": 52
  },
  {
    "stateCode": 848,
    "name": "Puntarenas",
    "countryCode": 52
  },
  {
    "stateCode": 849,
    "name": "San Jose",
    "countryCode": 52
  },
  {
    "stateCode": 850,
    "name": "Abidjan",
    "countryCode": 53
  },
  {
    "stateCode": 851,
    "name": "Agneby",
    "countryCode": 53
  },
  {
    "stateCode": 852,
    "name": "Bafing",
    "countryCode": 53
  },
  {
    "stateCode": 853,
    "name": "Denguele",
    "countryCode": 53
  },
  {
    "stateCode": 854,
    "name": "Dix-huit Montagnes",
    "countryCode": 53
  },
  {
    "stateCode": 855,
    "name": "Fromager",
    "countryCode": 53
  },
  {
    "stateCode": 856,
    "name": "Haut-Sassandra",
    "countryCode": 53
  },
  {
    "stateCode": 857,
    "name": "Lacs",
    "countryCode": 53
  },
  {
    "stateCode": 858,
    "name": "Lagunes",
    "countryCode": 53
  },
  {
    "stateCode": 859,
    "name": "Marahoue",
    "countryCode": 53
  },
  {
    "stateCode": 860,
    "name": "Moyen-Cavally",
    "countryCode": 53
  },
  {
    "stateCode": 861,
    "name": "Moyen-Comoe",
    "countryCode": 53
  },
  {
    "stateCode": 862,
    "name": "N\\zi-Comoe, 53"
  },
  {
    "stateCode": 863,
    "name": "Sassandra",
    "countryCode": 53
  },
  {
    "stateCode": 864,
    "name": "Savanes",
    "countryCode": 53
  },
  {
    "stateCode": 865,
    "name": "Sud-Bandama",
    "countryCode": 53
  },
  {
    "stateCode": 866,
    "name": "Sud-Comoe",
    "countryCode": 53
  },
  {
    "stateCode": 867,
    "name": "Vallee du Bandama",
    "countryCode": 53
  },
  {
    "stateCode": 868,
    "name": "Worodougou",
    "countryCode": 53
  },
  {
    "stateCode": 869,
    "name": "Zanzan",
    "countryCode": 53
  },
  {
    "stateCode": 870,
    "name": "Bjelovar-Bilogora",
    "countryCode": 54
  },
  {
    "stateCode": 871,
    "name": "Dubrovnik-Neretva",
    "countryCode": 54
  },
  {
    "stateCode": 872,
    "name": "Grad Zagreb",
    "countryCode": 54
  },
  {
    "stateCode": 873,
    "name": "Istra",
    "countryCode": 54
  },
  {
    "stateCode": 874,
    "name": "Karlovac",
    "countryCode": 54
  },
  {
    "stateCode": 875,
    "name": "Koprivnica-Krizhevci",
    "countryCode": 54
  },
  {
    "stateCode": 876,
    "name": "Krapina-Zagorje",
    "countryCode": 54
  },
  {
    "stateCode": 877,
    "name": "Lika-Senj",
    "countryCode": 54
  },
  {
    "stateCode": 878,
    "name": "Medhimurje",
    "countryCode": 54
  },
  {
    "stateCode": 879,
    "name": "Medimurska Zupanija",
    "countryCode": 54
  },
  {
    "stateCode": 880,
    "name": "Osijek-Baranja",
    "countryCode": 54
  },
  {
    "stateCode": 881,
    "name": "Osjecko-Baranjska Zupanija",
    "countryCode": 54
  },
  {
    "stateCode": 882,
    "name": "Pozhega-Slavonija",
    "countryCode": 54
  },
  {
    "stateCode": 883,
    "name": "Primorje-Gorski Kotar",
    "countryCode": 54
  },
  {
    "stateCode": 884,
    "name": "Shibenik-Knin",
    "countryCode": 54
  },
  {
    "stateCode": 885,
    "name": "Sisak-Moslavina",
    "countryCode": 54
  },
  {
    "stateCode": 886,
    "name": "Slavonski Brod-Posavina",
    "countryCode": 54
  },
  {
    "stateCode": 887,
    "name": "Split-Dalmacija",
    "countryCode": 54
  },
  {
    "stateCode": 888,
    "name": "Varazhdin",
    "countryCode": 54
  },
  {
    "stateCode": 889,
    "name": "Virovitica-Podravina",
    "countryCode": 54
  },
  {
    "stateCode": 890,
    "name": "Vukovar-Srijem",
    "countryCode": 54
  },
  {
    "stateCode": 891,
    "name": "Zadar",
    "countryCode": 54
  },
  {
    "stateCode": 892,
    "name": "Zagreb",
    "countryCode": 54
  },
  {
    "stateCode": 893,
    "name": "Camaguey",
    "countryCode": 55
  },
  {
    "stateCode": 894,
    "name": "Ciego de Avila",
    "countryCode": 55
  },
  {
    "stateCode": 895,
    "name": "Cienfuegos",
    "countryCode": 55
  },
  {
    "stateCode": 896,
    "name": "Ciudad de la Habana",
    "countryCode": 55
  },
  {
    "stateCode": 897,
    "name": "Granma",
    "countryCode": 55
  },
  {
    "stateCode": 898,
    "name": "Guantanamo",
    "countryCode": 55
  },
  {
    "stateCode": 899,
    "name": "Habana",
    "countryCode": 55
  },
  {
    "stateCode": 900,
    "name": "Holguin",
    "countryCode": 55
  },
  {
    "stateCode": 901,
    "name": "Isla de la Juventud",
    "countryCode": 55
  },
  {
    "stateCode": 902,
    "name": "La Habana",
    "countryCode": 55
  },
  {
    "stateCode": 903,
    "name": "Las Tunas",
    "countryCode": 55
  },
  {
    "stateCode": 904,
    "name": "Matanzas",
    "countryCode": 55
  },
  {
    "stateCode": 905,
    "name": "Pinar del Rio",
    "countryCode": 55
  },
  {
    "stateCode": 906,
    "name": "Sancti Spiritus",
    "countryCode": 55
  },
  {
    "stateCode": 907,
    "name": "Santiago de Cuba",
    "countryCode": 55
  },
  {
    "stateCode": 908,
    "name": "Villa Clara",
    "countryCode": 55
  },
  {
    "stateCode": 909,
    "name": "Government controlled area",
    "countryCode": 56
  },
  {
    "stateCode": 910,
    "name": "Limassol",
    "countryCode": 56
  },
  {
    "stateCode": 911,
    "name": "Nicosia District",
    "countryCode": 56
  },
  {
    "stateCode": 912,
    "name": "Paphos",
    "countryCode": 56
  },
  {
    "stateCode": 913,
    "name": "Turkish controlled area",
    "countryCode": 56
  },
  {
    "stateCode": 914,
    "name": "Central Bohemian",
    "countryCode": 57
  },
  {
    "stateCode": 915,
    "name": "Frycovice",
    "countryCode": 57
  },
  {
    "stateCode": 916,
    "name": "Jihocesky Kraj",
    "countryCode": 57
  },
  {
    "stateCode": 917,
    "name": "Jihochesky",
    "countryCode": 57
  },
  {
    "stateCode": 918,
    "name": "Jihomoravsky",
    "countryCode": 57
  },
  {
    "stateCode": 919,
    "name": "Karlovarsky",
    "countryCode": 57
  },
  {
    "stateCode": 920,
    "name": "Klecany",
    "countryCode": 57
  },
  {
    "stateCode": 921,
    "name": "Kralovehradecky",
    "countryCode": 57
  },
  {
    "stateCode": 922,
    "name": "Liberecky",
    "countryCode": 57
  },
  {
    "stateCode": 923,
    "name": "Lipov",
    "countryCode": 57
  },
  {
    "stateCode": 924,
    "name": "Moravskoslezsky",
    "countryCode": 57
  },
  {
    "stateCode": 925,
    "name": "Olomoucky",
    "countryCode": 57
  },
  {
    "stateCode": 926,
    "name": "Olomoucky Kraj",
    "countryCode": 57
  },
  {
    "stateCode": 927,
    "name": "Pardubicky",
    "countryCode": 57
  },
  {
    "stateCode": 928,
    "name": "Plzensky",
    "countryCode": 57
  },
  {
    "stateCode": 929,
    "name": "Praha",
    "countryCode": 57
  },
  {
    "stateCode": 930,
    "name": "Rajhrad",
    "countryCode": 57
  },
  {
    "stateCode": 931,
    "name": "Smirice",
    "countryCode": 57
  },
  {
    "stateCode": 932,
    "name": "South Moravian",
    "countryCode": 57
  },
  {
    "stateCode": 933,
    "name": "Straz nad Nisou",
    "countryCode": 57
  },
  {
    "stateCode": 934,
    "name": "Stredochesky",
    "countryCode": 57
  },
  {
    "stateCode": 935,
    "name": "Unicov",
    "countryCode": 57
  },
  {
    "stateCode": 936,
    "name": "Ustecky",
    "countryCode": 57
  },
  {
    "stateCode": 937,
    "name": "Valletta",
    "countryCode": 57
  },
  {
    "stateCode": 938,
    "name": "Velesin",
    "countryCode": 57
  },
  {
    "stateCode": 939,
    "name": "Vysochina",
    "countryCode": 57
  },
  {
    "stateCode": 940,
    "name": "Zlinsky",
    "countryCode": 57
  },
  {
    "stateCode": 941,
    "name": "Arhus",
    "countryCode": 58
  },
  {
    "stateCode": 942,
    "name": "Bornholm",
    "countryCode": 58
  },
  {
    "stateCode": 943,
    "name": "Frederiksborg",
    "countryCode": 58
  },
  {
    "stateCode": 944,
    "name": "Fyn",
    "countryCode": 58
  },
  {
    "stateCode": 945,
    "name": "Hovedstaden",
    "countryCode": 58
  },
  {
    "stateCode": 946,
    "name": "Kobenhavn",
    "countryCode": 58
  },
  {
    "stateCode": 947,
    "name": "Kobenhavns Amt",
    "countryCode": 58
  },
  {
    "stateCode": 948,
    "name": "Kobenhavns Kommune",
    "countryCode": 58
  },
  {
    "stateCode": 949,
    "name": "Nordjylland",
    "countryCode": 58
  },
  {
    "stateCode": 950,
    "name": "Ribe",
    "countryCode": 58
  },
  {
    "stateCode": 951,
    "name": "Ringkobing",
    "countryCode": 58
  },
  {
    "stateCode": 952,
    "name": "Roervig",
    "countryCode": 58
  },
  {
    "stateCode": 953,
    "name": "Roskilde",
    "countryCode": 58
  },
  {
    "stateCode": 954,
    "name": "Roslev",
    "countryCode": 58
  },
  {
    "stateCode": 955,
    "name": "Sjaelland",
    "countryCode": 58
  },
  {
    "stateCode": 956,
    "name": "Soeborg",
    "countryCode": 58
  },
  {
    "stateCode": 957,
    "name": "Sonderjylland",
    "countryCode": 58
  },
  {
    "stateCode": 958,
    "name": "Storstrom",
    "countryCode": 58
  },
  {
    "stateCode": 959,
    "name": "Syddanmark",
    "countryCode": 58
  },
  {
    "stateCode": 960,
    "name": "Toelloese",
    "countryCode": 58
  },
  {
    "stateCode": 961,
    "name": "Vejle",
    "countryCode": 58
  },
  {
    "stateCode": 962,
    "name": "Vestsjalland",
    "countryCode": 58
  },
  {
    "stateCode": 963,
    "name": "Viborg",
    "countryCode": 58
  },
  {
    "stateCode": 964,
    "name": "\\Ali Sabih, 59"
  },
  {
    "stateCode": 965,
    "name": "Dikhil",
    "countryCode": 59
  },
  {
    "stateCode": 966,
    "name": "Jibuti",
    "countryCode": 59
  },
  {
    "stateCode": 967,
    "name": "Tajurah",
    "countryCode": 59
  },
  {
    "stateCode": 968,
    "name": "Ubuk",
    "countryCode": 59
  },
  {
    "stateCode": 969,
    "name": "Saint Andrew",
    "countryCode": 60
  },
  {
    "stateCode": 970,
    "name": "Saint David",
    "countryCode": 60
  },
  {
    "stateCode": 971,
    "name": "Saint George",
    "countryCode": 60
  },
  {
    "stateCode": 972,
    "name": "Saint John",
    "countryCode": 60
  },
  {
    "stateCode": 973,
    "name": "Saint Joseph",
    "countryCode": 60
  },
  {
    "stateCode": 974,
    "name": "Saint Luke",
    "countryCode": 60
  },
  {
    "stateCode": 975,
    "name": "Saint Mark",
    "countryCode": 60
  },
  {
    "stateCode": 976,
    "name": "Saint Patrick",
    "countryCode": 60
  },
  {
    "stateCode": 977,
    "name": "Saint Paul",
    "countryCode": 60
  },
  {
    "stateCode": 978,
    "name": "Saint Peter",
    "countryCode": 60
  },
  {
    "stateCode": 979,
    "name": "Azua",
    "countryCode": 61
  },
  {
    "stateCode": 980,
    "name": "Bahoruco",
    "countryCode": 61
  },
  {
    "stateCode": 981,
    "name": "Barahona",
    "countryCode": 61
  },
  {
    "stateCode": 982,
    "name": "Dajabon",
    "countryCode": 61
  },
  {
    "stateCode": 983,
    "name": "Distrito Nacional",
    "countryCode": 61
  },
  {
    "stateCode": 984,
    "name": "Duarte",
    "countryCode": 61
  },
  {
    "stateCode": 985,
    "name": "El Seybo",
    "countryCode": 61
  },
  {
    "stateCode": 986,
    "name": "Elias Pina",
    "countryCode": 61
  },
  {
    "stateCode": 987,
    "name": "Espaillat",
    "countryCode": 61
  },
  {
    "stateCode": 988,
    "name": "Hato Mayor",
    "countryCode": 61
  },
  {
    "stateCode": 989,
    "name": "Independencia",
    "countryCode": 61
  },
  {
    "stateCode": 990,
    "name": "La Altagracia",
    "countryCode": 61
  },
  {
    "stateCode": 991,
    "name": "La Romana",
    "countryCode": 61
  },
  {
    "stateCode": 992,
    "name": "La Vega",
    "countryCode": 61
  },
  {
    "stateCode": 993,
    "name": "Maria Trinidad Sanchez",
    "countryCode": 61
  },
  {
    "stateCode": 994,
    "name": "Monsenor Nouel",
    "countryCode": 61
  },
  {
    "stateCode": 995,
    "name": "Monte Cristi",
    "countryCode": 61
  },
  {
    "stateCode": 996,
    "name": "Monte Plata",
    "countryCode": 61
  },
  {
    "stateCode": 997,
    "name": "Pedernales",
    "countryCode": 61
  },
  {
    "stateCode": 998,
    "name": "Peravia",
    "countryCode": 61
  },
  {
    "stateCode": 999,
    "name": "Puerto Plata",
    "countryCode": 61
  },
  {
    "stateCode": 1000,
    "name": "Salcedo",
    "countryCode": 61
  },
  {
    "stateCode": 1001,
    "name": "Samana",
    "countryCode": 61
  },
  {
    "stateCode": 1002,
    "name": "San Cristobal",
    "countryCode": 61
  },
  {
    "stateCode": 1003,
    "name": "San Juan",
    "countryCode": 61
  },
  {
    "stateCode": 1004,
    "name": "San Pedro de Macoris",
    "countryCode": 61
  },
  {
    "stateCode": 1005,
    "name": "Sanchez Ramirez",
    "countryCode": 61
  },
  {
    "stateCode": 1006,
    "name": "Santiago",
    "countryCode": 61
  },
  {
    "stateCode": 1007,
    "name": "Santiago Rodriguez",
    "countryCode": 61
  },
  {
    "stateCode": 1008,
    "name": "Valverde",
    "countryCode": 61
  },
  {
    "stateCode": 1009,
    "name": "Aileu",
    "countryCode": 62
  },
  {
    "stateCode": 1010,
    "name": "Ainaro",
    "countryCode": 62
  },
  {
    "stateCode": 1011,
    "name": "Ambeno",
    "countryCode": 62
  },
  {
    "stateCode": 1012,
    "name": "Baucau",
    "countryCode": 62
  },
  {
    "stateCode": 1013,
    "name": "Bobonaro",
    "countryCode": 62
  },
  {
    "stateCode": 1014,
    "name": "Cova Lima",
    "countryCode": 62
  },
  {
    "stateCode": 1015,
    "name": "Dili",
    "countryCode": 62
  },
  {
    "stateCode": 1016,
    "name": "Ermera",
    "countryCode": 62
  },
  {
    "stateCode": 1017,
    "name": "Lautem",
    "countryCode": 62
  },
  {
    "stateCode": 1018,
    "name": "Liquica",
    "countryCode": 62
  },
  {
    "stateCode": 1019,
    "name": "Manatuto",
    "countryCode": 62
  },
  {
    "stateCode": 1020,
    "name": "Manufahi",
    "countryCode": 62
  },
  {
    "stateCode": 1021,
    "name": "Viqueque",
    "countryCode": 62
  },
  {
    "stateCode": 1022,
    "name": "Azuay",
    "countryCode": 63
  },
  {
    "stateCode": 1023,
    "name": "Bolivar",
    "countryCode": 63
  },
  {
    "stateCode": 1024,
    "name": "Canar",
    "countryCode": 63
  },
  {
    "stateCode": 1025,
    "name": "Carchi",
    "countryCode": 63
  },
  {
    "stateCode": 1026,
    "name": "Chimborazo",
    "countryCode": 63
  },
  {
    "stateCode": 1027,
    "name": "Cotopaxi",
    "countryCode": 63
  },
  {
    "stateCode": 1028,
    "name": "El Oro",
    "countryCode": 63
  },
  {
    "stateCode": 1029,
    "name": "Esmeraldas",
    "countryCode": 63
  },
  {
    "stateCode": 1030,
    "name": "Galapagos",
    "countryCode": 63
  },
  {
    "stateCode": 1031,
    "name": "Guayas",
    "countryCode": 63
  },
  {
    "stateCode": 1032,
    "name": "Imbabura",
    "countryCode": 63
  },
  {
    "stateCode": 1033,
    "name": "Loja",
    "countryCode": 63
  },
  {
    "stateCode": 1034,
    "name": "Los Rios",
    "countryCode": 63
  },
  {
    "stateCode": 1035,
    "name": "Manabi",
    "countryCode": 63
  },
  {
    "stateCode": 1036,
    "name": "Morona Santiago",
    "countryCode": 63
  },
  {
    "stateCode": 1037,
    "name": "Napo",
    "countryCode": 63
  },
  {
    "stateCode": 1038,
    "name": "Orellana",
    "countryCode": 63
  },
  {
    "stateCode": 1039,
    "name": "Pastaza",
    "countryCode": 63
  },
  {
    "stateCode": 1040,
    "name": "Pichincha",
    "countryCode": 63
  },
  {
    "stateCode": 1041,
    "name": "Sucumbios",
    "countryCode": 63
  },
  {
    "stateCode": 1042,
    "name": "Tungurahua",
    "countryCode": 63
  },
  {
    "stateCode": 1043,
    "name": "Zamora Chinchipe",
    "countryCode": 63
  },
  {
    "stateCode": 1044,
    "name": "Aswan",
    "countryCode": 64
  },
  {
    "stateCode": 1045,
    "name": "Asyut",
    "countryCode": 64
  },
  {
    "stateCode": 1046,
    "name": "Bani Suwayf",
    "countryCode": 64
  },
  {
    "stateCode": 1047,
    "name": "Bur Sa\\id, 64"
  },
  {
    "stateCode": 1048,
    "name": "Cairo",
    "countryCode": 64
  },
  {
    "stateCode": 1049,
    "name": "Dumyat",
    "countryCode": 64
  },
  {
    "stateCode": 1050,
    "name": "Kafr-ash-Shaykh",
    "countryCode": 64
  },
  {
    "stateCode": 1051,
    "name": "Matruh",
    "countryCode": 64
  },
  {
    "stateCode": 1052,
    "name": "Muhafazat ad Daqahliyah",
    "countryCode": 64
  },
  {
    "stateCode": 1053,
    "name": "Muhafazat al Fayyum",
    "countryCode": 64
  },
  {
    "stateCode": 1054,
    "name": "Muhafazat al Gharbiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1055,
    "name": "Muhafazat al Iskandariyah",
    "countryCode": 64
  },
  {
    "stateCode": 1056,
    "name": "Muhafazat al Qahirah",
    "countryCode": 64
  },
  {
    "stateCode": 1057,
    "name": "Qina",
    "countryCode": 64
  },
  {
    "stateCode": 1058,
    "name": "Sawhaj",
    "countryCode": 64
  },
  {
    "stateCode": 1059,
    "name": "Sina al-Janubiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1060,
    "name": "Sina ash-Shamaliyah",
    "countryCode": 64
  },
  {
    "stateCode": 1061,
    "name": "ad-Daqahliyah",
    "countryCode": 64
  },
  {
    "stateCode": 1062,
    "name": "al-Bahr-al-Ahmar",
    "countryCode": 64
  },
  {
    "stateCode": 1063,
    "name": "al-Buhayrah",
    "countryCode": 64
  },
  {
    "stateCode": 1064,
    "name": "al-Fayyum",
    "countryCode": 64
  },
  {
    "stateCode": 1065,
    "name": "al-Gharbiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1066,
    "name": "al-Iskandariyah",
    "countryCode": 64
  },
  {
    "stateCode": 1067,
    "name": "al-Ismailiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1068,
    "name": "al-Jizah",
    "countryCode": 64
  },
  {
    "stateCode": 1069,
    "name": "al-Minufiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1070,
    "name": "al-Minya",
    "countryCode": 64
  },
  {
    "stateCode": 1071,
    "name": "al-Qahira",
    "countryCode": 64
  },
  {
    "stateCode": 1072,
    "name": "al-Qalyubiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1073,
    "name": "al-Uqsur",
    "countryCode": 64
  },
  {
    "stateCode": 1074,
    "name": "al-Wadi al-Jadid",
    "countryCode": 64
  },
  {
    "stateCode": 1075,
    "name": "as-Suways",
    "countryCode": 64
  },
  {
    "stateCode": 1076,
    "name": "ash-Sharqiyah",
    "countryCode": 64
  },
  {
    "stateCode": 1077,
    "name": "Ahuachapan",
    "countryCode": 65
  },
  {
    "stateCode": 1078,
    "name": "Cabanas",
    "countryCode": 65
  },
  {
    "stateCode": 1079,
    "name": "Chalatenango",
    "countryCode": 65
  },
  {
    "stateCode": 1080,
    "name": "Cuscatlan",
    "countryCode": 65
  },
  {
    "stateCode": 1081,
    "name": "La Libertad",
    "countryCode": 65
  },
  {
    "stateCode": 1082,
    "name": "La Paz",
    "countryCode": 65
  },
  {
    "stateCode": 1083,
    "name": "La Union",
    "countryCode": 65
  },
  {
    "stateCode": 1084,
    "name": "Morazan",
    "countryCode": 65
  },
  {
    "stateCode": 1085,
    "name": "San Miguel",
    "countryCode": 65
  },
  {
    "stateCode": 1086,
    "name": "San Salvador",
    "countryCode": 65
  },
  {
    "stateCode": 1087,
    "name": "San Vicente",
    "countryCode": 65
  },
  {
    "stateCode": 1088,
    "name": "Santa Ana",
    "countryCode": 65
  },
  {
    "stateCode": 1089,
    "name": "Sonsonate",
    "countryCode": 65
  },
  {
    "stateCode": 1090,
    "name": "Usulutan",
    "countryCode": 65
  },
  {
    "stateCode": 1091,
    "name": "Annobon",
    "countryCode": 66
  },
  {
    "stateCode": 1092,
    "name": "Bioko Norte",
    "countryCode": 66
  },
  {
    "stateCode": 1093,
    "name": "Bioko Sur",
    "countryCode": 66
  },
  {
    "stateCode": 1094,
    "name": "Centro Sur",
    "countryCode": 66
  },
  {
    "stateCode": 1095,
    "name": "Kie-Ntem",
    "countryCode": 66
  },
  {
    "stateCode": 1096,
    "name": "Litoral",
    "countryCode": 66
  },
  {
    "stateCode": 1097,
    "name": "Wele-Nzas",
    "countryCode": 66
  },
  {
    "stateCode": 1098,
    "name": "Anseba",
    "countryCode": 67
  },
  {
    "stateCode": 1099,
    "name": "Debub",
    "countryCode": 67
  },
  {
    "stateCode": 1100,
    "name": "Debub-Keih-Bahri",
    "countryCode": 67
  },
  {
    "stateCode": 1101,
    "name": "Gash-Barka",
    "countryCode": 67
  },
  {
    "stateCode": 1102,
    "name": "Maekel",
    "countryCode": 67
  },
  {
    "stateCode": 1103,
    "name": "Semien-Keih-Bahri",
    "countryCode": 67
  },
  {
    "stateCode": 1104,
    "name": "Harju",
    "countryCode": 68
  },
  {
    "stateCode": 1105,
    "name": "Hiiu",
    "countryCode": 68
  },
  {
    "stateCode": 1106,
    "name": "Ida-Viru",
    "countryCode": 68
  },
  {
    "stateCode": 1107,
    "name": "Jarva",
    "countryCode": 68
  },
  {
    "stateCode": 1108,
    "name": "Jogeva",
    "countryCode": 68
  },
  {
    "stateCode": 1109,
    "name": "Laane",
    "countryCode": 68
  },
  {
    "stateCode": 1110,
    "name": "Laane-Viru",
    "countryCode": 68
  },
  {
    "stateCode": 1111,
    "name": "Parnu",
    "countryCode": 68
  },
  {
    "stateCode": 1112,
    "name": "Polva",
    "countryCode": 68
  },
  {
    "stateCode": 1113,
    "name": "Rapla",
    "countryCode": 68
  },
  {
    "stateCode": 1114,
    "name": "Saare",
    "countryCode": 68
  },
  {
    "stateCode": 1115,
    "name": "Tartu",
    "countryCode": 68
  },
  {
    "stateCode": 1116,
    "name": "Valga",
    "countryCode": 68
  },
  {
    "stateCode": 1117,
    "name": "Viljandi",
    "countryCode": 68
  },
  {
    "stateCode": 1118,
    "name": "Voru",
    "countryCode": 68
  },
  {
    "stateCode": 1119,
    "name": "Addis Abeba",
    "countryCode": 69
  },
  {
    "stateCode": 1120,
    "name": "Afar",
    "countryCode": 69
  },
  {
    "stateCode": 1121,
    "name": "Amhara",
    "countryCode": 69
  },
  {
    "stateCode": 1122,
    "name": "Benishangul",
    "countryCode": 69
  },
  {
    "stateCode": 1123,
    "name": "Diredawa",
    "countryCode": 69
  },
  {
    "stateCode": 1124,
    "name": "Gambella",
    "countryCode": 69
  },
  {
    "stateCode": 1125,
    "name": "Harar",
    "countryCode": 69
  },
  {
    "stateCode": 1126,
    "name": "Jigjiga",
    "countryCode": 69
  },
  {
    "stateCode": 1127,
    "name": "Mekele",
    "countryCode": 69
  },
  {
    "stateCode": 1128,
    "name": "Oromia",
    "countryCode": 69
  },
  {
    "stateCode": 1129,
    "name": "Somali",
    "countryCode": 69
  },
  {
    "stateCode": 1130,
    "name": "Southern",
    "countryCode": 69
  },
  {
    "stateCode": 1131,
    "name": "Tigray",
    "countryCode": 69
  },
  {
    "stateCode": 1132,
    "name": "Christmas Island",
    "countryCode": 70
  },
  {
    "stateCode": 1133,
    "name": "Cocos Islands",
    "countryCode": 70
  },
  {
    "stateCode": 1134,
    "name": "Coral Sea Islands",
    "countryCode": 70
  },
  {
    "stateCode": 1135,
    "name": "Falkland Islands",
    "countryCode": 71
  },
  {
    "stateCode": 1136,
    "name": "South Georgia",
    "countryCode": 71
  },
  {
    "stateCode": 1137,
    "name": "Klaksvik",
    "countryCode": 72
  },
  {
    "stateCode": 1138,
    "name": "Nor ara Eysturoy",
    "countryCode": 72
  },
  {
    "stateCode": 1139,
    "name": "Nor oy",
    "countryCode": 72
  },
  {
    "stateCode": 1140,
    "name": "Sandoy",
    "countryCode": 72
  },
  {
    "stateCode": 1141,
    "name": "Streymoy",
    "countryCode": 72
  },
  {
    "stateCode": 1142,
    "name": "Su uroy",
    "countryCode": 72
  },
  {
    "stateCode": 1143,
    "name": "Sy ra Eysturoy",
    "countryCode": 72
  },
  {
    "stateCode": 1144,
    "name": "Torshavn",
    "countryCode": 72
  },
  {
    "stateCode": 1145,
    "name": "Vaga",
    "countryCode": 72
  },
  {
    "stateCode": 1146,
    "name": "Central",
    "countryCode": 73
  },
  {
    "stateCode": 1147,
    "name": "Eastern",
    "countryCode": 73
  },
  {
    "stateCode": 1148,
    "name": "Northern",
    "countryCode": 73
  },
  {
    "stateCode": 1149,
    "name": "South Pacific",
    "countryCode": 73
  },
  {
    "stateCode": 1150,
    "name": "Western",
    "countryCode": 73
  },
  {
    "stateCode": 1151,
    "name": "Ahvenanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1152,
    "name": "Etela-Karjala",
    "countryCode": 74
  },
  {
    "stateCode": 1153,
    "name": "Etela-Pohjanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1154,
    "name": "Etela-Savo",
    "countryCode": 74
  },
  {
    "stateCode": 1155,
    "name": "Etela-Suomen Laani",
    "countryCode": 74
  },
  {
    "stateCode": 1156,
    "name": "Ita-Suomen Laani",
    "countryCode": 74
  },
  {
    "stateCode": 1157,
    "name": "Ita-Uusimaa",
    "countryCode": 74
  },
  {
    "stateCode": 1158,
    "name": "Kainuu",
    "countryCode": 74
  },
  {
    "stateCode": 1159,
    "name": "Kanta-Hame",
    "countryCode": 74
  },
  {
    "stateCode": 1160,
    "name": "Keski-Pohjanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1161,
    "name": "Keski-Suomi",
    "countryCode": 74
  },
  {
    "stateCode": 1162,
    "name": "Kymenlaakso",
    "countryCode": 74
  },
  {
    "stateCode": 1163,
    "name": "Lansi-Suomen Laani",
    "countryCode": 74
  },
  {
    "stateCode": 1164,
    "name": "Lappi",
    "countryCode": 74
  },
  {
    "stateCode": 1165,
    "name": "Northern Savonia",
    "countryCode": 74
  },
  {
    "stateCode": 1166,
    "name": "Ostrobothnia",
    "countryCode": 74
  },
  {
    "stateCode": 1167,
    "name": "Oulun Laani",
    "countryCode": 74
  },
  {
    "stateCode": 1168,
    "name": "Paijat-Hame",
    "countryCode": 74
  },
  {
    "stateCode": 1169,
    "name": "Pirkanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1170,
    "name": "Pohjanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1171,
    "name": "Pohjois-Karjala",
    "countryCode": 74
  },
  {
    "stateCode": 1172,
    "name": "Pohjois-Pohjanmaa",
    "countryCode": 74
  },
  {
    "stateCode": 1173,
    "name": "Pohjois-Savo",
    "countryCode": 74
  },
  {
    "stateCode": 1174,
    "name": "Saarijarvi",
    "countryCode": 74
  },
  {
    "stateCode": 1175,
    "name": "Satakunta",
    "countryCode": 74
  },
  {
    "stateCode": 1176,
    "name": "Southern Savonia",
    "countryCode": 74
  },
  {
    "stateCode": 1177,
    "name": "Tavastia Proper",
    "countryCode": 74
  },
  {
    "stateCode": 1178,
    "name": "Uleaborgs Lan",
    "countryCode": 74
  },
  {
    "stateCode": 1179,
    "name": "Uusimaa",
    "countryCode": 74
  },
  {
    "stateCode": 1180,
    "name": "Varsinais-Suomi",
    "countryCode": 74
  },
  {
    "stateCode": 1181,
    "name": "Ain",
    "countryCode": 75
  },
  {
    "stateCode": 1182,
    "name": "Aisne",
    "countryCode": 75
  },
  {
    "stateCode": 1183,
    "name": "Albi Le Sequestre",
    "countryCode": 75
  },
  {
    "stateCode": 1184,
    "name": "Allier",
    "countryCode": 75
  },
  {
    "stateCode": 1185,
    "name": "Alpes-Cote dAzur",
    "countryCode": 75
  },
  {
    "stateCode": 1186,
    "name": "Alpes-Maritimes",
    "countryCode": 75
  },
  {
    "stateCode": 1187,
    "name": "Alpes-de-Haute-Provence",
    "countryCode": 75
  },
  {
    "stateCode": 1188,
    "name": "Alsace",
    "countryCode": 75
  },
  {
    "stateCode": 1189,
    "name": "Aquitaine",
    "countryCode": 75
  },
  {
    "stateCode": 1190,
    "name": "Ardeche",
    "countryCode": 75
  },
  {
    "stateCode": 1191,
    "name": "Ardennes",
    "countryCode": 75
  },
  {
    "stateCode": 1192,
    "name": "Ariege",
    "countryCode": 75
  },
  {
    "stateCode": 1193,
    "name": "Aube",
    "countryCode": 75
  },
  {
    "stateCode": 1194,
    "name": "Aude",
    "countryCode": 75
  },
  {
    "stateCode": 1195,
    "name": "Auvergne",
    "countryCode": 75
  },
  {
    "stateCode": 1196,
    "name": "Aveyron",
    "countryCode": 75
  },
  {
    "stateCode": 1197,
    "name": "Bas-Rhin",
    "countryCode": 75
  },
  {
    "stateCode": 1198,
    "name": "Basse-Normandie",
    "countryCode": 75
  },
  {
    "stateCode": 1199,
    "name": "Bouches-du-Rhone",
    "countryCode": 75
  },
  {
    "stateCode": 1200,
    "name": "Bourgogne",
    "countryCode": 75
  },
  {
    "stateCode": 1201,
    "name": "Bretagne",
    "countryCode": 75
  },
  {
    "stateCode": 1202,
    "name": "Brittany",
    "countryCode": 75
  },
  {
    "stateCode": 1203,
    "name": "Burgundy",
    "countryCode": 75
  },
  {
    "stateCode": 1204,
    "name": "Calvados",
    "countryCode": 75
  },
  {
    "stateCode": 1205,
    "name": "Cantal",
    "countryCode": 75
  },
  {
    "stateCode": 1206,
    "name": "Cedex",
    "countryCode": 75
  },
  {
    "stateCode": 1207,
    "name": "Centre",
    "countryCode": 75
  },
  {
    "stateCode": 1208,
    "name": "Charente",
    "countryCode": 75
  },
  {
    "stateCode": 1209,
    "name": "Charente-Maritime",
    "countryCode": 75
  },
  {
    "stateCode": 1210,
    "name": "Cher",
    "countryCode": 75
  },
  {
    "stateCode": 1211,
    "name": "Correze",
    "countryCode": 75
  },
  {
    "stateCode": 1212,
    "name": "Corse-du-Sud",
    "countryCode": 75
  },
  {
    "stateCode": 1213,
    "name": "Cote-d\\Or, 75"
  },
  {
    "stateCode": 1214,
    "name": "Cotes-d\\Armor, 75"
  },
  {
    "stateCode": 1215,
    "name": "Creuse",
    "countryCode": 75
  },
  {
    "stateCode": 1216,
    "name": "Crolles",
    "countryCode": 75
  },
  {
    "stateCode": 1217,
    "name": "Deux-Sevres",
    "countryCode": 75
  },
  {
    "stateCode": 1218,
    "name": "Dordogne",
    "countryCode": 75
  },
  {
    "stateCode": 1219,
    "name": "Doubs",
    "countryCode": 75
  },
  {
    "stateCode": 1220,
    "name": "Drome",
    "countryCode": 75
  },
  {
    "stateCode": 1221,
    "name": "Essonne",
    "countryCode": 75
  },
  {
    "stateCode": 1222,
    "name": "Eure",
    "countryCode": 75
  },
  {
    "stateCode": 1223,
    "name": "Eure-et-Loir",
    "countryCode": 75
  },
  {
    "stateCode": 1224,
    "name": "Feucherolles",
    "countryCode": 75
  },
  {
    "stateCode": 1225,
    "name": "Finistere",
    "countryCode": 75
  },
  {
    "stateCode": 1226,
    "name": "Franche-Comte",
    "countryCode": 75
  },
  {
    "stateCode": 1227,
    "name": "Gard",
    "countryCode": 75
  },
  {
    "stateCode": 1228,
    "name": "Gers",
    "countryCode": 75
  },
  {
    "stateCode": 1229,
    "name": "Gironde",
    "countryCode": 75
  },
  {
    "stateCode": 1230,
    "name": "Haut-Rhin",
    "countryCode": 75
  },
  {
    "stateCode": 1231,
    "name": "Haute-Corse",
    "countryCode": 75
  },
  {
    "stateCode": 1232,
    "name": "Haute-Garonne",
    "countryCode": 75
  },
  {
    "stateCode": 1233,
    "name": "Haute-Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1234,
    "name": "Haute-Marne",
    "countryCode": 75
  },
  {
    "stateCode": 1235,
    "name": "Haute-Saone",
    "countryCode": 75
  },
  {
    "stateCode": 1236,
    "name": "Haute-Savoie",
    "countryCode": 75
  },
  {
    "stateCode": 1237,
    "name": "Haute-Vienne",
    "countryCode": 75
  },
  {
    "stateCode": 1238,
    "name": "Hautes-Alpes",
    "countryCode": 75
  },
  {
    "stateCode": 1239,
    "name": "Hautes-Pyrenees",
    "countryCode": 75
  },
  {
    "stateCode": 1240,
    "name": "Hauts-de-Seine",
    "countryCode": 75
  },
  {
    "stateCode": 1241,
    "name": "Herault",
    "countryCode": 75
  },
  {
    "stateCode": 1242,
    "name": "Ile-de-France",
    "countryCode": 75
  },
  {
    "stateCode": 1243,
    "name": "Ille-et-Vilaine",
    "countryCode": 75
  },
  {
    "stateCode": 1244,
    "name": "Indre",
    "countryCode": 75
  },
  {
    "stateCode": 1245,
    "name": "Indre-et-Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1246,
    "name": "Isere",
    "countryCode": 75
  },
  {
    "stateCode": 1247,
    "name": "Jura",
    "countryCode": 75
  },
  {
    "stateCode": 1248,
    "name": "Klagenfurt",
    "countryCode": 75
  },
  {
    "stateCode": 1249,
    "name": "Landes",
    "countryCode": 75
  },
  {
    "stateCode": 1250,
    "name": "Languedoc-Roussillon",
    "countryCode": 75
  },
  {
    "stateCode": 1251,
    "name": "Larcay",
    "countryCode": 75
  },
  {
    "stateCode": 1252,
    "name": "Le Castellet",
    "countryCode": 75
  },
  {
    "stateCode": 1253,
    "name": "Le Creusot",
    "countryCode": 75
  },
  {
    "stateCode": 1254,
    "name": "Limousin",
    "countryCode": 75
  },
  {
    "stateCode": 1255,
    "name": "Loir-et-Cher",
    "countryCode": 75
  },
  {
    "stateCode": 1256,
    "name": "Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1257,
    "name": "Loire-Atlantique",
    "countryCode": 75
  },
  {
    "stateCode": 1258,
    "name": "Loiret",
    "countryCode": 75
  },
  {
    "stateCode": 1259,
    "name": "Lorraine",
    "countryCode": 75
  },
  {
    "stateCode": 1260,
    "name": "Lot",
    "countryCode": 75
  },
  {
    "stateCode": 1261,
    "name": "Lot-et-Garonne",
    "countryCode": 75
  },
  {
    "stateCode": 1262,
    "name": "Lower Normandy",
    "countryCode": 75
  },
  {
    "stateCode": 1263,
    "name": "Lozere",
    "countryCode": 75
  },
  {
    "stateCode": 1264,
    "name": "Maine-et-Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1265,
    "name": "Manche",
    "countryCode": 75
  },
  {
    "stateCode": 1266,
    "name": "Marne",
    "countryCode": 75
  },
  {
    "stateCode": 1267,
    "name": "Mayenne",
    "countryCode": 75
  },
  {
    "stateCode": 1268,
    "name": "Meurthe-et-Moselle",
    "countryCode": 75
  },
  {
    "stateCode": 1269,
    "name": "Meuse",
    "countryCode": 75
  },
  {
    "stateCode": 1270,
    "name": "Midi-Pyrenees",
    "countryCode": 75
  },
  {
    "stateCode": 1271,
    "name": "Morbihan",
    "countryCode": 75
  },
  {
    "stateCode": 1272,
    "name": "Moselle",
    "countryCode": 75
  },
  {
    "stateCode": 1273,
    "name": "Nievre",
    "countryCode": 75
  },
  {
    "stateCode": 1274,
    "name": "Nord",
    "countryCode": 75
  },
  {
    "stateCode": 1275,
    "name": "Nord-Pas-de-Calais",
    "countryCode": 75
  },
  {
    "stateCode": 1276,
    "name": "Oise",
    "countryCode": 75
  },
  {
    "stateCode": 1277,
    "name": "Orne",
    "countryCode": 75
  },
  {
    "stateCode": 1278,
    "name": "Paris",
    "countryCode": 75
  },
  {
    "stateCode": 1279,
    "name": "Pas-de-Calais",
    "countryCode": 75
  },
  {
    "stateCode": 1280,
    "name": "Pays de la Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1281,
    "name": "Pays-de-la-Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1282,
    "name": "Picardy",
    "countryCode": 75
  },
  {
    "stateCode": 1283,
    "name": "Puy-de-Dome",
    "countryCode": 75
  },
  {
    "stateCode": 1284,
    "name": "Pyrenees-Atlantiques",
    "countryCode": 75
  },
  {
    "stateCode": 1285,
    "name": "Pyrenees-Orientales",
    "countryCode": 75
  },
  {
    "stateCode": 1286,
    "name": "Quelmes",
    "countryCode": 75
  },
  {
    "stateCode": 1287,
    "name": "Rhone",
    "countryCode": 75
  },
  {
    "stateCode": 1288,
    "name": "Rhone-Alpes",
    "countryCode": 75
  },
  {
    "stateCode": 1289,
    "name": "Saint Ouen",
    "countryCode": 75
  },
  {
    "stateCode": 1290,
    "name": "Saint Viatre",
    "countryCode": 75
  },
  {
    "stateCode": 1291,
    "name": "Saone-et-Loire",
    "countryCode": 75
  },
  {
    "stateCode": 1292,
    "name": "Sarthe",
    "countryCode": 75
  },
  {
    "stateCode": 1293,
    "name": "Savoie",
    "countryCode": 75
  },
  {
    "stateCode": 1294,
    "name": "Seine-Maritime",
    "countryCode": 75
  },
  {
    "stateCode": 1295,
    "name": "Seine-Saint-Denis",
    "countryCode": 75
  },
  {
    "stateCode": 1296,
    "name": "Seine-et-Marne",
    "countryCode": 75
  },
  {
    "stateCode": 1297,
    "name": "Somme",
    "countryCode": 75
  },
  {
    "stateCode": 1298,
    "name": "Sophia Antipolis",
    "countryCode": 75
  },
  {
    "stateCode": 1299,
    "name": "Souvans",
    "countryCode": 75
  },
  {
    "stateCode": 1300,
    "name": "Tarn",
    "countryCode": 75
  },
  {
    "stateCode": 1301,
    "name": "Tarn-et-Garonne",
    "countryCode": 75
  },
  {
    "stateCode": 1302,
    "name": "Territoire de Belfort",
    "countryCode": 75
  },
  {
    "stateCode": 1303,
    "name": "Treignac",
    "countryCode": 75
  },
  {
    "stateCode": 1304,
    "name": "Upper Normandy",
    "countryCode": 75
  },
  {
    "stateCode": 1305,
    "name": "Val-d\\Oise, 75"
  },
  {
    "stateCode": 1306,
    "name": "Val-de-Marne",
    "countryCode": 75
  },
  {
    "stateCode": 1307,
    "name": "Var",
    "countryCode": 75
  },
  {
    "stateCode": 1308,
    "name": "Vaucluse",
    "countryCode": 75
  },
  {
    "stateCode": 1309,
    "name": "Vellise",
    "countryCode": 75
  },
  {
    "stateCode": 1310,
    "name": "Vendee",
    "countryCode": 75
  },
  {
    "stateCode": 1311,
    "name": "Vienne",
    "countryCode": 75
  },
  {
    "stateCode": 1312,
    "name": "Vosges",
    "countryCode": 75
  },
  {
    "stateCode": 1313,
    "name": "Yonne",
    "countryCode": 75
  },
  {
    "stateCode": 1314,
    "name": "Yvelines",
    "countryCode": 75
  },
  {
    "stateCode": 1315,
    "name": "Cayenne",
    "countryCode": 76
  },
  {
    "stateCode": 1316,
    "name": "Saint-Laurent-du-Maroni",
    "countryCode": 76
  },
  {
    "stateCode": 1317,
    "name": "Iles du Vent",
    "countryCode": 77
  },
  {
    "stateCode": 1318,
    "name": "Iles sous le Vent",
    "countryCode": 77
  },
  {
    "stateCode": 1319,
    "name": "Marquesas",
    "countryCode": 77
  },
  {
    "stateCode": 1320,
    "name": "Tuamotu",
    "countryCode": 77
  },
  {
    "stateCode": 1321,
    "name": "Tubuai",
    "countryCode": 77
  },
  {
    "stateCode": 1322,
    "name": "Amsterdam",
    "countryCode": 78
  },
  {
    "stateCode": 1323,
    "name": "Crozet Islands",
    "countryCode": 78
  },
  {
    "stateCode": 1324,
    "name": "Kerguelen",
    "countryCode": 78
  },
  {
    "stateCode": 1325,
    "name": "Estuaire",
    "countryCode": 79
  },
  {
    "stateCode": 1326,
    "name": "Haut-Ogooue",
    "countryCode": 79
  },
  {
    "stateCode": 1327,
    "name": "Moyen-Ogooue",
    "countryCode": 79
  },
  {
    "stateCode": 1328,
    "name": "Ngounie",
    "countryCode": 79
  },
  {
    "stateCode": 1329,
    "name": "Nyanga",
    "countryCode": 79
  },
  {
    "stateCode": 1330,
    "name": "Ogooue-Ivindo",
    "countryCode": 79
  },
  {
    "stateCode": 1331,
    "name": "Ogooue-Lolo",
    "countryCode": 79
  },
  {
    "stateCode": 1332,
    "name": "Ogooue-Maritime",
    "countryCode": 79
  },
  {
    "stateCode": 1333,
    "name": "Woleu-Ntem",
    "countryCode": 79
  },
  {
    "stateCode": 1334,
    "name": "Banjul",
    "countryCode": 80
  },
  {
    "stateCode": 1335,
    "name": "Basse",
    "countryCode": 80
  },
  {
    "stateCode": 1336,
    "name": "Brikama",
    "countryCode": 80
  },
  {
    "stateCode": 1337,
    "name": "Janjanbureh",
    "countryCode": 80
  },
  {
    "stateCode": 1338,
    "name": "Kanifing",
    "countryCode": 80
  },
  {
    "stateCode": 1339,
    "name": "Kerewan",
    "countryCode": 80
  },
  {
    "stateCode": 1340,
    "name": "Kuntaur",
    "countryCode": 80
  },
  {
    "stateCode": 1341,
    "name": "Mansakonko",
    "countryCode": 80
  },
  {
    "stateCode": 1342,
    "name": "Abhasia",
    "countryCode": 81
  },
  {
    "stateCode": 1343,
    "name": "Ajaria",
    "countryCode": 81
  },
  {
    "stateCode": 1344,
    "name": "Guria",
    "countryCode": 81
  },
  {
    "stateCode": 1345,
    "name": "Imereti",
    "countryCode": 81
  },
  {
    "stateCode": 1346,
    "name": "Kaheti",
    "countryCode": 81
  },
  {
    "stateCode": 1347,
    "name": "Kvemo Kartli",
    "countryCode": 81
  },
  {
    "stateCode": 1348,
    "name": "Mcheta-Mtianeti",
    "countryCode": 81
  },
  {
    "stateCode": 1349,
    "name": "Racha",
    "countryCode": 81
  },
  {
    "stateCode": 1350,
    "name": "Samagrelo-Zemo Svaneti",
    "countryCode": 81
  },
  {
    "stateCode": 1351,
    "name": "Samche-Zhavaheti",
    "countryCode": 81
  },
  {
    "stateCode": 1352,
    "name": "Shida Kartli",
    "countryCode": 81
  },
  {
    "stateCode": 1353,
    "name": "Tbilisi",
    "countryCode": 81
  },
  {
    "stateCode": 1354,
    "name": "Auvergne",
    "countryCode": 82
  },
  {
    "stateCode": 1355,
    "name": "Baden-Wurttemberg",
    "countryCode": 82
  },
  {
    "stateCode": 1356,
    "name": "Bavaria",
    "countryCode": 82
  },
  {
    "stateCode": 1357,
    "name": "Bayern",
    "countryCode": 82
  },
  {
    "stateCode": 1358,
    "name": "Beilstein Wurtt",
    "countryCode": 82
  },
  {
    "stateCode": 1359,
    "name": "Berlin",
    "countryCode": 82
  },
  {
    "stateCode": 1360,
    "name": "Brandenburg",
    "countryCode": 82
  },
  {
    "stateCode": 1361,
    "name": "Bremen",
    "countryCode": 82
  },
  {
    "stateCode": 1362,
    "name": "Dreisbach",
    "countryCode": 82
  },
  {
    "stateCode": 1363,
    "name": "Freistaat Bayern",
    "countryCode": 82
  },
  {
    "stateCode": 1364,
    "name": "Hamburg",
    "countryCode": 82
  },
  {
    "stateCode": 1365,
    "name": "Hannover",
    "countryCode": 82
  },
  {
    "stateCode": 1366,
    "name": "Heroldstatt",
    "countryCode": 82
  },
  {
    "stateCode": 1367,
    "name": "Hessen",
    "countryCode": 82
  },
  {
    "stateCode": 1368,
    "name": "Kortenberg",
    "countryCode": 82
  },
  {
    "stateCode": 1369,
    "name": "Laasdorf",
    "countryCode": 82
  },
  {
    "stateCode": 1370,
    "name": "Land Baden-Wurttemberg",
    "countryCode": 82
  },
  {
    "stateCode": 1371,
    "name": "Land Bayern",
    "countryCode": 82
  },
  {
    "stateCode": 1372,
    "name": "Land Brandenburg",
    "countryCode": 82
  },
  {
    "stateCode": 1373,
    "name": "Land Hessen",
    "countryCode": 82
  },
  {
    "stateCode": 1374,
    "name": "Land Mecklenburg-Vorpommern",
    "countryCode": 82
  },
  {
    "stateCode": 1375,
    "name": "Land Nordrhein-Westfalen",
    "countryCode": 82
  },
  {
    "stateCode": 1376,
    "name": "Land Rheinland-Pfalz",
    "countryCode": 82
  },
  {
    "stateCode": 1377,
    "name": "Land Sachsen",
    "countryCode": 82
  },
  {
    "stateCode": 1378,
    "name": "Land Sachsen-Anhalt",
    "countryCode": 82
  },
  {
    "stateCode": 1379,
    "name": "Land Thuringen",
    "countryCode": 82
  },
  {
    "stateCode": 1380,
    "name": "Lower Saxony",
    "countryCode": 82
  },
  {
    "stateCode": 1381,
    "name": "Mecklenburg-Vorpommern",
    "countryCode": 82
  },
  {
    "stateCode": 1382,
    "name": "Mulfingen",
    "countryCode": 82
  },
  {
    "stateCode": 1383,
    "name": "Munich",
    "countryCode": 82
  },
  {
    "stateCode": 1384,
    "name": "Neubeuern",
    "countryCode": 82
  },
  {
    "stateCode": 1385,
    "name": "Niedersachsen",
    "countryCode": 82
  },
  {
    "stateCode": 1386,
    "name": "Noord-Holland",
    "countryCode": 82
  },
  {
    "stateCode": 1387,
    "name": "Nordrhein-Westfalen",
    "countryCode": 82
  },
  {
    "stateCode": 1388,
    "name": "North Rhine-Westphalia",
    "countryCode": 82
  },
  {
    "stateCode": 1389,
    "name": "Osterode",
    "countryCode": 82
  },
  {
    "stateCode": 1390,
    "name": "Rheinland-Pfalz",
    "countryCode": 82
  },
  {
    "stateCode": 1391,
    "name": "Rhineland-Palatinate",
    "countryCode": 82
  },
  {
    "stateCode": 1392,
    "name": "Saarland",
    "countryCode": 82
  },
  {
    "stateCode": 1393,
    "name": "Sachsen",
    "countryCode": 82
  },
  {
    "stateCode": 1394,
    "name": "Sachsen-Anhalt",
    "countryCode": 82
  },
  {
    "stateCode": 1395,
    "name": "Saxony",
    "countryCode": 82
  },
  {
    "stateCode": 1396,
    "name": "Schleswig-Holstein",
    "countryCode": 82
  },
  {
    "stateCode": 1397,
    "name": "Thuringia",
    "countryCode": 82
  },
  {
    "stateCode": 1398,
    "name": "Webling",
    "countryCode": 82
  },
  {
    "stateCode": 1399,
    "name": "Weinstrabe",
    "countryCode": 82
  },
  {
    "stateCode": 1400,
    "name": "schlobborn",
    "countryCode": 82
  },
  {
    "stateCode": 1401,
    "name": "Ashanti",
    "countryCode": 83
  },
  {
    "stateCode": 1402,
    "name": "Brong-Ahafo",
    "countryCode": 83
  },
  {
    "stateCode": 1403,
    "name": "Central",
    "countryCode": 83
  },
  {
    "stateCode": 1404,
    "name": "Eastern",
    "countryCode": 83
  },
  {
    "stateCode": 1405,
    "name": "Greater Accra",
    "countryCode": 83
  },
  {
    "stateCode": 1406,
    "name": "Northern",
    "countryCode": 83
  },
  {
    "stateCode": 1407,
    "name": "Upper East",
    "countryCode": 83
  },
  {
    "stateCode": 1408,
    "name": "Upper West",
    "countryCode": 83
  },
  {
    "stateCode": 1409,
    "name": "Volta",
    "countryCode": 83
  },
  {
    "stateCode": 1410,
    "name": "Western",
    "countryCode": 83
  },
  {
    "stateCode": 1411,
    "name": "Gibraltar",
    "countryCode": 84
  },
  {
    "stateCode": 1412,
    "name": "Acharnes",
    "countryCode": 85
  },
  {
    "stateCode": 1413,
    "name": "Ahaia",
    "countryCode": 85
  },
  {
    "stateCode": 1414,
    "name": "Aitolia kai Akarnania",
    "countryCode": 85
  },
  {
    "stateCode": 1415,
    "name": "Argolis",
    "countryCode": 85
  },
  {
    "stateCode": 1416,
    "name": "Arkadia",
    "countryCode": 85
  },
  {
    "stateCode": 1417,
    "name": "Arta",
    "countryCode": 85
  },
  {
    "stateCode": 1418,
    "name": "Attica",
    "countryCode": 85
  },
  {
    "stateCode": 1419,
    "name": "Attiki",
    "countryCode": 85
  },
  {
    "stateCode": 1420,
    "name": "Ayion Oros",
    "countryCode": 85
  },
  {
    "stateCode": 1421,
    "name": "Crete",
    "countryCode": 85
  },
  {
    "stateCode": 1422,
    "name": "Dodekanisos",
    "countryCode": 85
  },
  {
    "stateCode": 1423,
    "name": "Drama",
    "countryCode": 85
  },
  {
    "stateCode": 1424,
    "name": "Evia",
    "countryCode": 85
  },
  {
    "stateCode": 1425,
    "name": "Evritania",
    "countryCode": 85
  },
  {
    "stateCode": 1426,
    "name": "Evros",
    "countryCode": 85
  },
  {
    "stateCode": 1427,
    "name": "Evvoia",
    "countryCode": 85
  },
  {
    "stateCode": 1428,
    "name": "Florina",
    "countryCode": 85
  },
  {
    "stateCode": 1429,
    "name": "Fokis",
    "countryCode": 85
  },
  {
    "stateCode": 1430,
    "name": "Fthiotis",
    "countryCode": 85
  },
  {
    "stateCode": 1431,
    "name": "Grevena",
    "countryCode": 85
  },
  {
    "stateCode": 1432,
    "name": "Halandri",
    "countryCode": 85
  },
  {
    "stateCode": 1433,
    "name": "Halkidiki",
    "countryCode": 85
  },
  {
    "stateCode": 1434,
    "name": "Hania",
    "countryCode": 85
  },
  {
    "stateCode": 1435,
    "name": "Heraklion",
    "countryCode": 85
  },
  {
    "stateCode": 1436,
    "name": "Hios",
    "countryCode": 85
  },
  {
    "stateCode": 1437,
    "name": "Ilia",
    "countryCode": 85
  },
  {
    "stateCode": 1438,
    "name": "Imathia",
    "countryCode": 85
  },
  {
    "stateCode": 1439,
    "name": "Ioannina",
    "countryCode": 85
  },
  {
    "stateCode": 1440,
    "name": "Iraklion",
    "countryCode": 85
  },
  {
    "stateCode": 1441,
    "name": "Karditsa",
    "countryCode": 85
  },
  {
    "stateCode": 1442,
    "name": "Kastoria",
    "countryCode": 85
  },
  {
    "stateCode": 1443,
    "name": "Kavala",
    "countryCode": 85
  },
  {
    "stateCode": 1444,
    "name": "Kefallinia",
    "countryCode": 85
  },
  {
    "stateCode": 1445,
    "name": "Kerkira",
    "countryCode": 85
  },
  {
    "stateCode": 1446,
    "name": "Kiklades",
    "countryCode": 85
  },
  {
    "stateCode": 1447,
    "name": "Kilkis",
    "countryCode": 85
  },
  {
    "stateCode": 1448,
    "name": "Korinthia",
    "countryCode": 85
  },
  {
    "stateCode": 1449,
    "name": "Kozani",
    "countryCode": 85
  },
  {
    "stateCode": 1450,
    "name": "Lakonia",
    "countryCode": 85
  },
  {
    "stateCode": 1451,
    "name": "Larisa",
    "countryCode": 85
  },
  {
    "stateCode": 1452,
    "name": "Lasithi",
    "countryCode": 85
  },
  {
    "stateCode": 1453,
    "name": "Lesvos",
    "countryCode": 85
  },
  {
    "stateCode": 1454,
    "name": "Levkas",
    "countryCode": 85
  },
  {
    "stateCode": 1455,
    "name": "Magnisia",
    "countryCode": 85
  },
  {
    "stateCode": 1456,
    "name": "Messinia",
    "countryCode": 85
  },
  {
    "stateCode": 1457,
    "name": "Nomos Attikis",
    "countryCode": 85
  },
  {
    "stateCode": 1458,
    "name": "Nomos Zakynthou",
    "countryCode": 85
  },
  {
    "stateCode": 1459,
    "name": "Pella",
    "countryCode": 85
  },
  {
    "stateCode": 1460,
    "name": "Pieria",
    "countryCode": 85
  },
  {
    "stateCode": 1461,
    "name": "Piraios",
    "countryCode": 85
  },
  {
    "stateCode": 1462,
    "name": "Preveza",
    "countryCode": 85
  },
  {
    "stateCode": 1463,
    "name": "Rethimni",
    "countryCode": 85
  },
  {
    "stateCode": 1464,
    "name": "Rodopi",
    "countryCode": 85
  },
  {
    "stateCode": 1465,
    "name": "Samos",
    "countryCode": 85
  },
  {
    "stateCode": 1466,
    "name": "Serrai",
    "countryCode": 85
  },
  {
    "stateCode": 1467,
    "name": "Thesprotia",
    "countryCode": 85
  },
  {
    "stateCode": 1468,
    "name": "Thessaloniki",
    "countryCode": 85
  },
  {
    "stateCode": 1469,
    "name": "Trikala",
    "countryCode": 85
  },
  {
    "stateCode": 1470,
    "name": "Voiotia",
    "countryCode": 85
  },
  {
    "stateCode": 1471,
    "name": "West Greece",
    "countryCode": 85
  },
  {
    "stateCode": 1472,
    "name": "Xanthi",
    "countryCode": 85
  },
  {
    "stateCode": 1473,
    "name": "Zakinthos",
    "countryCode": 85
  },
  {
    "stateCode": 1474,
    "name": "Aasiaat",
    "countryCode": 86
  },
  {
    "stateCode": 1475,
    "name": "Ammassalik",
    "countryCode": 86
  },
  {
    "stateCode": 1476,
    "name": "Illoqqortoormiut",
    "countryCode": 86
  },
  {
    "stateCode": 1477,
    "name": "Ilulissat",
    "countryCode": 86
  },
  {
    "stateCode": 1478,
    "name": "Ivittuut",
    "countryCode": 86
  },
  {
    "stateCode": 1479,
    "name": "Kangaatsiaq",
    "countryCode": 86
  },
  {
    "stateCode": 1480,
    "name": "Maniitsoq",
    "countryCode": 86
  },
  {
    "stateCode": 1481,
    "name": "Nanortalik",
    "countryCode": 86
  },
  {
    "stateCode": 1482,
    "name": "Narsaq",
    "countryCode": 86
  },
  {
    "stateCode": 1483,
    "name": "Nuuk",
    "countryCode": 86
  },
  {
    "stateCode": 1484,
    "name": "Paamiut",
    "countryCode": 86
  },
  {
    "stateCode": 1485,
    "name": "Qaanaaq",
    "countryCode": 86
  },
  {
    "stateCode": 1486,
    "name": "Qaqortoq",
    "countryCode": 86
  },
  {
    "stateCode": 1487,
    "name": "Qasigiannguit",
    "countryCode": 86
  },
  {
    "stateCode": 1488,
    "name": "Qeqertarsuaq",
    "countryCode": 86
  },
  {
    "stateCode": 1489,
    "name": "Sisimiut",
    "countryCode": 86
  },
  {
    "stateCode": 1490,
    "name": "Udenfor kommunal inddeling",
    "countryCode": 86
  },
  {
    "stateCode": 1491,
    "name": "Upernavik",
    "countryCode": 86
  },
  {
    "stateCode": 1492,
    "name": "Uummannaq",
    "countryCode": 86
  },
  {
    "stateCode": 1493,
    "name": "Carriacou-Petite Martinique",
    "countryCode": 87
  },
  {
    "stateCode": 1494,
    "name": "Saint Andrew",
    "countryCode": 87
  },
  {
    "stateCode": 1495,
    "name": "Saint Davids",
    "countryCode": 87
  },
  {
    "stateCode": 1496,
    "name": "Saint George\\s, 87"
  },
  {
    "stateCode": 1497,
    "name": "Saint John",
    "countryCode": 87
  },
  {
    "stateCode": 1498,
    "name": "Saint Mark",
    "countryCode": 87
  },
  {
    "stateCode": 1499,
    "name": "Saint Patrick",
    "countryCode": 87
  },
  {
    "stateCode": 1500,
    "name": "Basse-Terre",
    "countryCode": 88
  },
  {
    "stateCode": 1501,
    "name": "Grande-Terre",
    "countryCode": 88
  },
  {
    "stateCode": 1502,
    "name": "Iles des Saintes",
    "countryCode": 88
  },
  {
    "stateCode": 1503,
    "name": "La Desirade",
    "countryCode": 88
  },
  {
    "stateCode": 1504,
    "name": "Marie-Galante",
    "countryCode": 88
  },
  {
    "stateCode": 1505,
    "name": "Saint Barthelemy",
    "countryCode": 88
  },
  {
    "stateCode": 1506,
    "name": "Saint Martin",
    "countryCode": 88
  },
  {
    "stateCode": 1507,
    "name": "Agana Heights",
    "countryCode": 89
  },
  {
    "stateCode": 1508,
    "name": "Agat",
    "countryCode": 89
  },
  {
    "stateCode": 1509,
    "name": "Barrigada",
    "countryCode": 89
  },
  {
    "stateCode": 1510,
    "name": "Chalan-Pago-Ordot",
    "countryCode": 89
  },
  {
    "stateCode": 1511,
    "name": "Dededo",
    "countryCode": 89
  },
  {
    "stateCode": 1512,
    "name": "Hagatna",
    "countryCode": 89
  },
  {
    "stateCode": 1513,
    "name": "Inarajan",
    "countryCode": 89
  },
  {
    "stateCode": 1514,
    "name": "Mangilao",
    "countryCode": 89
  },
  {
    "stateCode": 1515,
    "name": "Merizo",
    "countryCode": 89
  },
  {
    "stateCode": 1516,
    "name": "Mongmong-Toto-Maite",
    "countryCode": 89
  },
  {
    "stateCode": 1517,
    "name": "Santa Rita",
    "countryCode": 89
  },
  {
    "stateCode": 1518,
    "name": "Sinajana",
    "countryCode": 89
  },
  {
    "stateCode": 1519,
    "name": "Talofofo",
    "countryCode": 89
  },
  {
    "stateCode": 1520,
    "name": "Tamuning",
    "countryCode": 89
  },
  {
    "stateCode": 1521,
    "name": "Yigo",
    "countryCode": 89
  },
  {
    "stateCode": 1522,
    "name": "Yona",
    "countryCode": 89
  },
  {
    "stateCode": 1523,
    "name": "Alta Verapaz",
    "countryCode": 90
  },
  {
    "stateCode": 1524,
    "name": "Baja Verapaz",
    "countryCode": 90
  },
  {
    "stateCode": 1525,
    "name": "Chimaltenango",
    "countryCode": 90
  },
  {
    "stateCode": 1526,
    "name": "Chiquimula",
    "countryCode": 90
  },
  {
    "stateCode": 1527,
    "name": "El Progreso",
    "countryCode": 90
  },
  {
    "stateCode": 1528,
    "name": "Escuintla",
    "countryCode": 90
  },
  {
    "stateCode": 1529,
    "name": "Guatemala",
    "countryCode": 90
  },
  {
    "stateCode": 1530,
    "name": "Huehuetenango",
    "countryCode": 90
  },
  {
    "stateCode": 1531,
    "name": "Izabal",
    "countryCode": 90
  },
  {
    "stateCode": 1532,
    "name": "Jalapa",
    "countryCode": 90
  },
  {
    "stateCode": 1533,
    "name": "Jutiapa",
    "countryCode": 90
  },
  {
    "stateCode": 1534,
    "name": "Peten",
    "countryCode": 90
  },
  {
    "stateCode": 1535,
    "name": "Quezaltenango",
    "countryCode": 90
  },
  {
    "stateCode": 1536,
    "name": "Quiche",
    "countryCode": 90
  },
  {
    "stateCode": 1537,
    "name": "Retalhuleu",
    "countryCode": 90
  },
  {
    "stateCode": 1538,
    "name": "Sacatepequez",
    "countryCode": 90
  },
  {
    "stateCode": 1539,
    "name": "San Marcos",
    "countryCode": 90
  },
  {
    "stateCode": 1540,
    "name": "Santa Rosa",
    "countryCode": 90
  },
  {
    "stateCode": 1541,
    "name": "Solola",
    "countryCode": 90
  },
  {
    "stateCode": 1542,
    "name": "Suchitepequez",
    "countryCode": 90
  },
  {
    "stateCode": 1543,
    "name": "Totonicapan",
    "countryCode": 90
  },
  {
    "stateCode": 1544,
    "name": "Zacapa",
    "countryCode": 90
  },
  {
    "stateCode": 1545,
    "name": "Alderney",
    "countryCode": 91
  },
  {
    "stateCode": 1546,
    "name": "Castel",
    "countryCode": 91
  },
  {
    "stateCode": 1547,
    "name": "Forest",
    "countryCode": 91
  },
  {
    "stateCode": 1548,
    "name": "Saint Andrew",
    "countryCode": 91
  },
  {
    "stateCode": 1549,
    "name": "Saint Martin",
    "countryCode": 91
  },
  {
    "stateCode": 1550,
    "name": "Saint Peter Port",
    "countryCode": 91
  },
  {
    "stateCode": 1551,
    "name": "Saint Pierre du Bois",
    "countryCode": 91
  },
  {
    "stateCode": 1552,
    "name": "Saint Sampson",
    "countryCode": 91
  },
  {
    "stateCode": 1553,
    "name": "Saint Saviour",
    "countryCode": 91
  },
  {
    "stateCode": 1554,
    "name": "Sark",
    "countryCode": 91
  },
  {
    "stateCode": 1555,
    "name": "Torteval",
    "countryCode": 91
  },
  {
    "stateCode": 1556,
    "name": "Vale",
    "countryCode": 91
  },
  {
    "stateCode": 1557,
    "name": "Beyla",
    "countryCode": 92
  },
  {
    "stateCode": 1558,
    "name": "Boffa",
    "countryCode": 92
  },
  {
    "stateCode": 1559,
    "name": "Boke",
    "countryCode": 92
  },
  {
    "stateCode": 1560,
    "name": "Conakry",
    "countryCode": 92
  },
  {
    "stateCode": 1561,
    "name": "Coyah",
    "countryCode": 92
  },
  {
    "stateCode": 1562,
    "name": "Dabola",
    "countryCode": 92
  },
  {
    "stateCode": 1563,
    "name": "Dalaba",
    "countryCode": 92
  },
  {
    "stateCode": 1564,
    "name": "Dinguiraye",
    "countryCode": 92
  },
  {
    "stateCode": 1565,
    "name": "Faranah",
    "countryCode": 92
  },
  {
    "stateCode": 1566,
    "name": "Forecariah",
    "countryCode": 92
  },
  {
    "stateCode": 1567,
    "name": "Fria",
    "countryCode": 92
  },
  {
    "stateCode": 1568,
    "name": "Gaoual",
    "countryCode": 92
  },
  {
    "stateCode": 1569,
    "name": "Gueckedou",
    "countryCode": 92
  },
  {
    "stateCode": 1570,
    "name": "Kankan",
    "countryCode": 92
  },
  {
    "stateCode": 1571,
    "name": "Kerouane",
    "countryCode": 92
  },
  {
    "stateCode": 1572,
    "name": "Kindia",
    "countryCode": 92
  },
  {
    "stateCode": 1573,
    "name": "Kissidougou",
    "countryCode": 92
  },
  {
    "stateCode": 1574,
    "name": "Koubia",
    "countryCode": 92
  },
  {
    "stateCode": 1575,
    "name": "Koundara",
    "countryCode": 92
  },
  {
    "stateCode": 1576,
    "name": "Kouroussa",
    "countryCode": 92
  },
  {
    "stateCode": 1577,
    "name": "Labe",
    "countryCode": 92
  },
  {
    "stateCode": 1578,
    "name": "Lola",
    "countryCode": 92
  },
  {
    "stateCode": 1579,
    "name": "Macenta",
    "countryCode": 92
  },
  {
    "stateCode": 1580,
    "name": "Mali",
    "countryCode": 92
  },
  {
    "stateCode": 1581,
    "name": "Mamou",
    "countryCode": 92
  },
  {
    "stateCode": 1582,
    "name": "Mandiana",
    "countryCode": 92
  },
  {
    "stateCode": 1583,
    "name": "Nzerekore",
    "countryCode": 92
  },
  {
    "stateCode": 1584,
    "name": "Pita",
    "countryCode": 92
  },
  {
    "stateCode": 1585,
    "name": "Siguiri",
    "countryCode": 92
  },
  {
    "stateCode": 1586,
    "name": "Telimele",
    "countryCode": 92
  },
  {
    "stateCode": 1587,
    "name": "Tougue",
    "countryCode": 92
  },
  {
    "stateCode": 1588,
    "name": "Yomou",
    "countryCode": 92
  },
  {
    "stateCode": 1589,
    "name": "Bafata",
    "countryCode": 93
  },
  {
    "stateCode": 1590,
    "name": "Bissau",
    "countryCode": 93
  },
  {
    "stateCode": 1591,
    "name": "Bolama",
    "countryCode": 93
  },
  {
    "stateCode": 1592,
    "name": "Cacheu",
    "countryCode": 93
  },
  {
    "stateCode": 1593,
    "name": "Gabu",
    "countryCode": 93
  },
  {
    "stateCode": 1594,
    "name": "Oio",
    "countryCode": 93
  },
  {
    "stateCode": 1595,
    "name": "Quinara",
    "countryCode": 93
  },
  {
    "stateCode": 1596,
    "name": "Tombali",
    "countryCode": 93
  },
  {
    "stateCode": 1597,
    "name": "Barima-Waini",
    "countryCode": 94
  },
  {
    "stateCode": 1598,
    "name": "Cuyuni-Mazaruni",
    "countryCode": 94
  },
  {
    "stateCode": 1599,
    "name": "Demerara-Mahaica",
    "countryCode": 94
  },
  {
    "stateCode": 1600,
    "name": "East Berbice-Corentyne",
    "countryCode": 94
  },
  {
    "stateCode": 1601,
    "name": "Essequibo Islands-West Demerar",
    "countryCode": 94
  },
  {
    "stateCode": 1602,
    "name": "Mahaica-Berbice",
    "countryCode": 94
  },
  {
    "stateCode": 1603,
    "name": "Pomeroon-Supenaam",
    "countryCode": 94
  },
  {
    "stateCode": 1604,
    "name": "Potaro-Siparuni",
    "countryCode": 94
  },
  {
    "stateCode": 1605,
    "name": "Upper Demerara-Berbice",
    "countryCode": 94
  },
  {
    "stateCode": 1606,
    "name": "Upper Takutu-Upper Essequibo",
    "countryCode": 94
  },
  {
    "stateCode": 1607,
    "name": "Artibonite",
    "countryCode": 95
  },
  {
    "stateCode": 1608,
    "name": "Centre",
    "countryCode": 95
  },
  {
    "stateCode": 1609,
    "name": "Grand\\Anse, 95"
  },
  {
    "stateCode": 1610,
    "name": "Nord",
    "countryCode": 95
  },
  {
    "stateCode": 1611,
    "name": "Nord-Est",
    "countryCode": 95
  },
  {
    "stateCode": 1612,
    "name": "Nord-Ouest",
    "countryCode": 95
  },
  {
    "stateCode": 1613,
    "name": "Ouest",
    "countryCode": 95
  },
  {
    "stateCode": 1614,
    "name": "Sud",
    "countryCode": 95
  },
  {
    "stateCode": 1615,
    "name": "Sud-Est",
    "countryCode": 95
  },
  {
    "stateCode": 1616,
    "name": "Heard and McDonald Islands",
    "countryCode": 96
  },
  {
    "stateCode": 1617,
    "name": "Atlantida",
    "countryCode": 97
  },
  {
    "stateCode": 1618,
    "name": "Choluteca",
    "countryCode": 97
  },
  {
    "stateCode": 1619,
    "name": "Colon",
    "countryCode": 97
  },
  {
    "stateCode": 1620,
    "name": "Comayagua",
    "countryCode": 97
  },
  {
    "stateCode": 1621,
    "name": "Copan",
    "countryCode": 97
  },
  {
    "stateCode": 1622,
    "name": "Cortes",
    "countryCode": 97
  },
  {
    "stateCode": 1623,
    "name": "Distrito Central",
    "countryCode": 97
  },
  {
    "stateCode": 1624,
    "name": "El Paraiso",
    "countryCode": 97
  },
  {
    "stateCode": 1625,
    "name": "Francisco Morazan",
    "countryCode": 97
  },
  {
    "stateCode": 1626,
    "name": "Gracias a Dios",
    "countryCode": 97
  },
  {
    "stateCode": 1627,
    "name": "Intibuca",
    "countryCode": 97
  },
  {
    "stateCode": 1628,
    "name": "Islas de la Bahia",
    "countryCode": 97
  },
  {
    "stateCode": 1629,
    "name": "La Paz",
    "countryCode": 97
  },
  {
    "stateCode": 1630,
    "name": "Lempira",
    "countryCode": 97
  },
  {
    "stateCode": 1631,
    "name": "Ocotepeque",
    "countryCode": 97
  },
  {
    "stateCode": 1632,
    "name": "Olancho",
    "countryCode": 97
  },
  {
    "stateCode": 1633,
    "name": "Santa Barbara",
    "countryCode": 97
  },
  {
    "stateCode": 1634,
    "name": "Valle",
    "countryCode": 97
  },
  {
    "stateCode": 1635,
    "name": "Yoro",
    "countryCode": 97
  },
  {
    "stateCode": 1636,
    "name": "Hong Kong",
    "countryCode": 98
  },
  {
    "stateCode": 1637,
    "name": "Bacs-Kiskun",
    "countryCode": 99
  },
  {
    "stateCode": 1638,
    "name": "Baranya",
    "countryCode": 99
  },
  {
    "stateCode": 1639,
    "name": "Bekes",
    "countryCode": 99
  },
  {
    "stateCode": 1640,
    "name": "Borsod-Abauj-Zemplen",
    "countryCode": 99
  },
  {
    "stateCode": 1641,
    "name": "Budapest",
    "countryCode": 99
  },
  {
    "stateCode": 1642,
    "name": "Csongrad",
    "countryCode": 99
  },
  {
    "stateCode": 1643,
    "name": "Fejer",
    "countryCode": 99
  },
  {
    "stateCode": 1644,
    "name": "Gyor-Moson-Sopron",
    "countryCode": 99
  },
  {
    "stateCode": 1645,
    "name": "Hajdu-Bihar",
    "countryCode": 99
  },
  {
    "stateCode": 1646,
    "name": "Heves",
    "countryCode": 99
  },
  {
    "stateCode": 1647,
    "name": "Jasz-Nagykun-Szolnok",
    "countryCode": 99
  },
  {
    "stateCode": 1648,
    "name": "Komarom-Esztergom",
    "countryCode": 99
  },
  {
    "stateCode": 1649,
    "name": "Nograd",
    "countryCode": 99
  },
  {
    "stateCode": 1650,
    "name": "Pest",
    "countryCode": 99
  },
  {
    "stateCode": 1651,
    "name": "Somogy",
    "countryCode": 99
  },
  {
    "stateCode": 1652,
    "name": "Szabolcs-Szatmar-Bereg",
    "countryCode": 99
  },
  {
    "stateCode": 1653,
    "name": "Tolna",
    "countryCode": 99
  },
  {
    "stateCode": 1654,
    "name": "Vas",
    "countryCode": 99
  },
  {
    "stateCode": 1655,
    "name": "Veszprem",
    "countryCode": 99
  },
  {
    "stateCode": 1656,
    "name": "Zala",
    "countryCode": 99
  },
  {
    "stateCode": 1657,
    "name": "Austurland",
    "countryCode": 100
  },
  {
    "stateCode": 1658,
    "name": "Gullbringusysla",
    "countryCode": 100
  },
  {
    "stateCode": 1659,
    "name": "Hofu borgarsva i",
    "countryCode": 100
  },
  {
    "stateCode": 1660,
    "name": "Nor urland eystra",
    "countryCode": 100
  },
  {
    "stateCode": 1661,
    "name": "Nor urland vestra",
    "countryCode": 100
  },
  {
    "stateCode": 1662,
    "name": "Su urland",
    "countryCode": 100
  },
  {
    "stateCode": 1663,
    "name": "Su urnes",
    "countryCode": 100
  },
  {
    "stateCode": 1664,
    "name": "Vestfir ir",
    "countryCode": 100
  },
  {
    "stateCode": 1665,
    "name": "Vesturland",
    "countryCode": 100
  },
  {
    "stateCode": 1666,
    "name": "Aceh",
    "countryCode": 102
  },
  {
    "stateCode": 1667,
    "name": "Bali",
    "countryCode": 102
  },
  {
    "stateCode": 1668,
    "name": "Bangka-Belitung",
    "countryCode": 102
  },
  {
    "stateCode": 1669,
    "name": "Banten",
    "countryCode": 102
  },
  {
    "stateCode": 1670,
    "name": "Bengkulu",
    "countryCode": 102
  },
  {
    "stateCode": 1671,
    "name": "Gandaria",
    "countryCode": 102
  },
  {
    "stateCode": 1672,
    "name": "Gorontalo",
    "countryCode": 102
  },
  {
    "stateCode": 1673,
    "name": "Jakarta",
    "countryCode": 102
  },
  {
    "stateCode": 1674,
    "name": "Jambi",
    "countryCode": 102
  },
  {
    "stateCode": 1675,
    "name": "Jawa Barat",
    "countryCode": 102
  },
  {
    "stateCode": 1676,
    "name": "Jawa Tengah",
    "countryCode": 102
  },
  {
    "stateCode": 1677,
    "name": "Jawa Timur",
    "countryCode": 102
  },
  {
    "stateCode": 1678,
    "name": "Kalimantan Barat",
    "countryCode": 102
  },
  {
    "stateCode": 1679,
    "name": "Kalimantan Selatan",
    "countryCode": 102
  },
  {
    "stateCode": 1680,
    "name": "Kalimantan Tengah",
    "countryCode": 102
  },
  {
    "stateCode": 1681,
    "name": "Kalimantan Timur",
    "countryCode": 102
  },
  {
    "stateCode": 1682,
    "name": "Kendal",
    "countryCode": 102
  },
  {
    "stateCode": 1683,
    "name": "Lampung",
    "countryCode": 102
  },
  {
    "stateCode": 1684,
    "name": "Maluku",
    "countryCode": 102
  },
  {
    "stateCode": 1685,
    "name": "Maluku Utara",
    "countryCode": 102
  },
  {
    "stateCode": 1686,
    "name": "Nusa Tenggara Barat",
    "countryCode": 102
  },
  {
    "stateCode": 1687,
    "name": "Nusa Tenggara Timur",
    "countryCode": 102
  },
  {
    "stateCode": 1688,
    "name": "Papua",
    "countryCode": 102
  },
  {
    "stateCode": 1689,
    "name": "Riau",
    "countryCode": 102
  },
  {
    "stateCode": 1690,
    "name": "Riau Kepulauan",
    "countryCode": 102
  },
  {
    "stateCode": 1691,
    "name": "Solo",
    "countryCode": 102
  },
  {
    "stateCode": 1692,
    "name": "Sulawesi Selatan",
    "countryCode": 102
  },
  {
    "stateCode": 1693,
    "name": "Sulawesi Tengah",
    "countryCode": 102
  },
  {
    "stateCode": 1694,
    "name": "Sulawesi Tenggara",
    "countryCode": 102
  },
  {
    "stateCode": 1695,
    "name": "Sulawesi Utara",
    "countryCode": 102
  },
  {
    "stateCode": 1696,
    "name": "Sumatera Barat",
    "countryCode": 102
  },
  {
    "stateCode": 1697,
    "name": "Sumatera Selatan",
    "countryCode": 102
  },
  {
    "stateCode": 1698,
    "name": "Sumatera Utara",
    "countryCode": 102
  },
  {
    "stateCode": 1699,
    "name": "Yogyakarta",
    "countryCode": 102
  },
  {
    "stateCode": 1700,
    "name": "Ardabil",
    "countryCode": 103
  },
  {
    "stateCode": 1701,
    "name": "Azarbayjan-e Bakhtari",
    "countryCode": 103
  },
  {
    "stateCode": 1702,
    "name": "Azarbayjan-e Khavari",
    "countryCode": 103
  },
  {
    "stateCode": 1703,
    "name": "Bushehr",
    "countryCode": 103
  },
  {
    "stateCode": 1704,
    "name": "Chahar Mahal-e Bakhtiari",
    "countryCode": 103
  },
  {
    "stateCode": 1705,
    "name": "Esfahan",
    "countryCode": 103
  },
  {
    "stateCode": 1706,
    "name": "Fars",
    "countryCode": 103
  },
  {
    "stateCode": 1707,
    "name": "Gilan",
    "countryCode": 103
  },
  {
    "stateCode": 1708,
    "name": "Golestan",
    "countryCode": 103
  },
  {
    "stateCode": 1709,
    "name": "Hamadan",
    "countryCode": 103
  },
  {
    "stateCode": 1710,
    "name": "Hormozgan",
    "countryCode": 103
  },
  {
    "stateCode": 1711,
    "name": "Ilam",
    "countryCode": 103
  },
  {
    "stateCode": 1712,
    "name": "Kerman",
    "countryCode": 103
  },
  {
    "stateCode": 1713,
    "name": "Kermanshah",
    "countryCode": 103
  },
  {
    "stateCode": 1714,
    "name": "Khorasan",
    "countryCode": 103
  },
  {
    "stateCode": 1715,
    "name": "Khuzestan",
    "countryCode": 103
  },
  {
    "stateCode": 1716,
    "name": "Kohgiluyeh-e Boyerahmad",
    "countryCode": 103
  },
  {
    "stateCode": 1717,
    "name": "Kordestan",
    "countryCode": 103
  },
  {
    "stateCode": 1718,
    "name": "Lorestan",
    "countryCode": 103
  },
  {
    "stateCode": 1719,
    "name": "Markazi",
    "countryCode": 103
  },
  {
    "stateCode": 1720,
    "name": "Mazandaran",
    "countryCode": 103
  },
  {
    "stateCode": 1721,
    "name": "Ostan-e Esfahan",
    "countryCode": 103
  },
  {
    "stateCode": 1722,
    "name": "Qazvin",
    "countryCode": 103
  },
  {
    "stateCode": 1723,
    "name": "Qom",
    "countryCode": 103
  },
  {
    "stateCode": 1724,
    "name": "Semnan",
    "countryCode": 103
  },
  {
    "stateCode": 1725,
    "name": "Sistan-e Baluchestan",
    "countryCode": 103
  },
  {
    "stateCode": 1726,
    "name": "Tehran",
    "countryCode": 103
  },
  {
    "stateCode": 1727,
    "name": "Yazd",
    "countryCode": 103
  },
  {
    "stateCode": 1728,
    "name": "Zanjan",
    "countryCode": 103
  },
  {
    "stateCode": 1729,
    "name": "Babil",
    "countryCode": 104
  },
  {
    "stateCode": 1730,
    "name": "Baghdad",
    "countryCode": 104
  },
  {
    "stateCode": 1731,
    "name": "Dahuk",
    "countryCode": 104
  },
  {
    "stateCode": 1732,
    "name": "Dhi Qar",
    "countryCode": 104
  },
  {
    "stateCode": 1733,
    "name": "Diyala",
    "countryCode": 104
  },
  {
    "stateCode": 1734,
    "name": "Erbil",
    "countryCode": 104
  },
  {
    "stateCode": 1735,
    "name": "Irbil",
    "countryCode": 104
  },
  {
    "stateCode": 1736,
    "name": "Karbala",
    "countryCode": 104
  },
  {
    "stateCode": 1737,
    "name": "Kurdistan",
    "countryCode": 104
  },
  {
    "stateCode": 1738,
    "name": "Maysan",
    "countryCode": 104
  },
  {
    "stateCode": 1739,
    "name": "Ninawa",
    "countryCode": 104
  },
  {
    "stateCode": 1740,
    "name": "Salah-ad-Din",
    "countryCode": 104
  },
  {
    "stateCode": 1741,
    "name": "Wasit",
    "countryCode": 104
  },
  {
    "stateCode": 1742,
    "name": "al-Anbar",
    "countryCode": 104
  },
  {
    "stateCode": 1743,
    "name": "al-Basrah",
    "countryCode": 104
  },
  {
    "stateCode": 1744,
    "name": "al-Muthanna",
    "countryCode": 104
  },
  {
    "stateCode": 1745,
    "name": "al-Qadisiyah",
    "countryCode": 104
  },
  {
    "stateCode": 1746,
    "name": "an-Najaf",
    "countryCode": 104
  },
  {
    "stateCode": 1747,
    "name": "as-Sulaymaniyah",
    "countryCode": 104
  },
  {
    "stateCode": 1748,
    "name": "at-Ta\\mim, 104"
  },
  {
    "stateCode": 1749,
    "name": "Armagh",
    "countryCode": 105
  },
  {
    "stateCode": 1750,
    "name": "Carlow",
    "countryCode": 105
  },
  {
    "stateCode": 1751,
    "name": "Cavan",
    "countryCode": 105
  },
  {
    "stateCode": 1752,
    "name": "Clare",
    "countryCode": 105
  },
  {
    "stateCode": 1753,
    "name": "Cork",
    "countryCode": 105
  },
  {
    "stateCode": 1754,
    "name": "Donegal",
    "countryCode": 105
  },
  {
    "stateCode": 1755,
    "name": "Dublin",
    "countryCode": 105
  },
  {
    "stateCode": 1756,
    "name": "Galway",
    "countryCode": 105
  },
  {
    "stateCode": 1757,
    "name": "Kerry",
    "countryCode": 105
  },
  {
    "stateCode": 1758,
    "name": "Kildare",
    "countryCode": 105
  },
  {
    "stateCode": 1759,
    "name": "Kilkenny",
    "countryCode": 105
  },
  {
    "stateCode": 1760,
    "name": "Laois",
    "countryCode": 105
  },
  {
    "stateCode": 1761,
    "name": "Leinster",
    "countryCode": 105
  },
  {
    "stateCode": 1762,
    "name": "Leitrim",
    "countryCode": 105
  },
  {
    "stateCode": 1763,
    "name": "Limerick",
    "countryCode": 105
  },
  {
    "stateCode": 1764,
    "name": "Loch Garman",
    "countryCode": 105
  },
  {
    "stateCode": 1765,
    "name": "Longford",
    "countryCode": 105
  },
  {
    "stateCode": 1766,
    "name": "Louth",
    "countryCode": 105
  },
  {
    "stateCode": 1767,
    "name": "Mayo",
    "countryCode": 105
  },
  {
    "stateCode": 1768,
    "name": "Meath",
    "countryCode": 105
  },
  {
    "stateCode": 1769,
    "name": "Monaghan",
    "countryCode": 105
  },
  {
    "stateCode": 1770,
    "name": "Offaly",
    "countryCode": 105
  },
  {
    "stateCode": 1771,
    "name": "Roscommon",
    "countryCode": 105
  },
  {
    "stateCode": 1772,
    "name": "Sligo",
    "countryCode": 105
  },
  {
    "stateCode": 1773,
    "name": "Tipperary North Riding",
    "countryCode": 105
  },
  {
    "stateCode": 1774,
    "name": "Tipperary South Riding",
    "countryCode": 105
  },
  {
    "stateCode": 1775,
    "name": "Ulster",
    "countryCode": 105
  },
  {
    "stateCode": 1776,
    "name": "Waterford",
    "countryCode": 105
  },
  {
    "stateCode": 1777,
    "name": "Westmeath",
    "countryCode": 105
  },
  {
    "stateCode": 1778,
    "name": "Wexford",
    "countryCode": 105
  },
  {
    "stateCode": 1779,
    "name": "Wicklow",
    "countryCode": 105
  },
  {
    "stateCode": 1780,
    "name": "Beit Hanania",
    "countryCode": 106
  },
  {
    "stateCode": 1781,
    "name": "Ben Gurion Airport",
    "countryCode": 106
  },
  {
    "stateCode": 1782,
    "name": "Bethlehem",
    "countryCode": 106
  },
  {
    "stateCode": 1783,
    "name": "Caesarea",
    "countryCode": 106
  },
  {
    "stateCode": 1784,
    "name": "Centre",
    "countryCode": 106
  },
  {
    "stateCode": 1785,
    "name": "Gaza",
    "countryCode": 106
  },
  {
    "stateCode": 1786,
    "name": "Hadaron",
    "countryCode": 106
  },
  {
    "stateCode": 1787,
    "name": "Haifa District",
    "countryCode": 106
  },
  {
    "stateCode": 1788,
    "name": "Hamerkaz",
    "countryCode": 106
  },
  {
    "stateCode": 1789,
    "name": "Hazafon",
    "countryCode": 106
  },
  {
    "stateCode": 1790,
    "name": "Hebron",
    "countryCode": 106
  },
  {
    "stateCode": 1791,
    "name": "Jaffa",
    "countryCode": 106
  },
  {
    "stateCode": 1792,
    "name": "Jerusalem",
    "countryCode": 106
  },
  {
    "stateCode": 1793,
    "name": "Khefa",
    "countryCode": 106
  },
  {
    "stateCode": 1794,
    "name": "Kiryat Yam",
    "countryCode": 106
  },
  {
    "stateCode": 1795,
    "name": "Lower Galilee",
    "countryCode": 106
  },
  {
    "stateCode": 1796,
    "name": "Qalqilya",
    "countryCode": 106
  },
  {
    "stateCode": 1797,
    "name": "Talme Elazar",
    "countryCode": 106
  },
  {
    "stateCode": 1798,
    "name": "Tel Aviv",
    "countryCode": 106
  },
  {
    "stateCode": 1799,
    "name": "Tsafon",
    "countryCode": 106
  },
  {
    "stateCode": 1800,
    "name": "Umm El Fahem",
    "countryCode": 106
  },
  {
    "stateCode": 1801,
    "name": "Yerushalayim",
    "countryCode": 106
  },
  {
    "stateCode": 1802,
    "name": "Abruzzi",
    "countryCode": 107
  },
  {
    "stateCode": 1803,
    "name": "Abruzzo",
    "countryCode": 107
  },
  {
    "stateCode": 1804,
    "name": "Agrigento",
    "countryCode": 107
  },
  {
    "stateCode": 1805,
    "name": "Alessandria",
    "countryCode": 107
  },
  {
    "stateCode": 1806,
    "name": "Ancona",
    "countryCode": 107
  },
  {
    "stateCode": 1807,
    "name": "Arezzo",
    "countryCode": 107
  },
  {
    "stateCode": 1808,
    "name": "Ascoli Piceno",
    "countryCode": 107
  },
  {
    "stateCode": 1809,
    "name": "Asti",
    "countryCode": 107
  },
  {
    "stateCode": 1810,
    "name": "Avellino",
    "countryCode": 107
  },
  {
    "stateCode": 1811,
    "name": "Bari",
    "countryCode": 107
  },
  {
    "stateCode": 1812,
    "name": "Basilicata",
    "countryCode": 107
  },
  {
    "stateCode": 1813,
    "name": "Belluno",
    "countryCode": 107
  },
  {
    "stateCode": 1814,
    "name": "Benevento",
    "countryCode": 107
  },
  {
    "stateCode": 1815,
    "name": "Bergamo",
    "countryCode": 107
  },
  {
    "stateCode": 1816,
    "name": "Biella",
    "countryCode": 107
  },
  {
    "stateCode": 1817,
    "name": "Bologna",
    "countryCode": 107
  },
  {
    "stateCode": 1818,
    "name": "Bolzano",
    "countryCode": 107
  },
  {
    "stateCode": 1819,
    "name": "Brescia",
    "countryCode": 107
  },
  {
    "stateCode": 1820,
    "name": "Brindisi",
    "countryCode": 107
  },
  {
    "stateCode": 1821,
    "name": "Calabria",
    "countryCode": 107
  },
  {
    "stateCode": 1822,
    "name": "Campania",
    "countryCode": 107
  },
  {
    "stateCode": 1823,
    "name": "Cartoceto",
    "countryCode": 107
  },
  {
    "stateCode": 1824,
    "name": "Caserta",
    "countryCode": 107
  },
  {
    "stateCode": 1825,
    "name": "Catania",
    "countryCode": 107
  },
  {
    "stateCode": 1826,
    "name": "Chieti",
    "countryCode": 107
  },
  {
    "stateCode": 1827,
    "name": "Como",
    "countryCode": 107
  },
  {
    "stateCode": 1828,
    "name": "Cosenza",
    "countryCode": 107
  },
  {
    "stateCode": 1829,
    "name": "Cremona",
    "countryCode": 107
  },
  {
    "stateCode": 1830,
    "name": "Cuneo",
    "countryCode": 107
  },
  {
    "stateCode": 1831,
    "name": "Emilia-Romagna",
    "countryCode": 107
  },
  {
    "stateCode": 1832,
    "name": "Ferrara",
    "countryCode": 107
  },
  {
    "stateCode": 1833,
    "name": "Firenze",
    "countryCode": 107
  },
  {
    "stateCode": 1834,
    "name": "Florence",
    "countryCode": 107
  },
  {
    "stateCode": 1835,
    "name": "Forli-Cesena",
    "countryCode": 107
  },
  {
    "stateCode": 1836,
    "name": "Friuli-Venezia Giulia",
    "countryCode": 107
  },
  {
    "stateCode": 1837,
    "name": "Frosinone",
    "countryCode": 107
  },
  {
    "stateCode": 1838,
    "name": "Genoa",
    "countryCode": 107
  },
  {
    "stateCode": 1839,
    "name": "Gorizia",
    "countryCode": 107
  },
  {
    "stateCode": 1840,
    "name": "L\\Aquila, 107"
  },
  {
    "stateCode": 1841,
    "name": "Lazio",
    "countryCode": 107
  },
  {
    "stateCode": 1842,
    "name": "Lecce",
    "countryCode": 107
  },
  {
    "stateCode": 1843,
    "name": "Lecco",
    "countryCode": 107
  },
  {
    "stateCode": 1844,
    "name": "Lecco Province",
    "countryCode": 107
  },
  {
    "stateCode": 1845,
    "name": "Liguria",
    "countryCode": 107
  },
  {
    "stateCode": 1846,
    "name": "Lodi",
    "countryCode": 107
  },
  {
    "stateCode": 1847,
    "name": "Lombardia",
    "countryCode": 107
  },
  {
    "stateCode": 1848,
    "name": "Lombardy",
    "countryCode": 107
  },
  {
    "stateCode": 1849,
    "name": "Macerata",
    "countryCode": 107
  },
  {
    "stateCode": 1850,
    "name": "Mantova",
    "countryCode": 107
  },
  {
    "stateCode": 1851,
    "name": "Marche",
    "countryCode": 107
  },
  {
    "stateCode": 1852,
    "name": "Messina",
    "countryCode": 107
  },
  {
    "stateCode": 1853,
    "name": "Milan",
    "countryCode": 107
  },
  {
    "stateCode": 1854,
    "name": "Modena",
    "countryCode": 107
  },
  {
    "stateCode": 1855,
    "name": "Molise",
    "countryCode": 107
  },
  {
    "stateCode": 1856,
    "name": "Molteno",
    "countryCode": 107
  },
  {
    "stateCode": 1857,
    "name": "Montenegro",
    "countryCode": 107
  },
  {
    "stateCode": 1858,
    "name": "Monza and Brianza",
    "countryCode": 107
  },
  {
    "stateCode": 1859,
    "name": "Naples",
    "countryCode": 107
  },
  {
    "stateCode": 1860,
    "name": "Novara",
    "countryCode": 107
  },
  {
    "stateCode": 1861,
    "name": "Padova",
    "countryCode": 107
  },
  {
    "stateCode": 1862,
    "name": "Parma",
    "countryCode": 107
  },
  {
    "stateCode": 1863,
    "name": "Pavia",
    "countryCode": 107
  },
  {
    "stateCode": 1864,
    "name": "Perugia",
    "countryCode": 107
  },
  {
    "stateCode": 1865,
    "name": "Pesaro-Urbino",
    "countryCode": 107
  },
  {
    "stateCode": 1866,
    "name": "Piacenza",
    "countryCode": 107
  },
  {
    "stateCode": 1867,
    "name": "Piedmont",
    "countryCode": 107
  },
  {
    "stateCode": 1868,
    "name": "Piemonte",
    "countryCode": 107
  },
  {
    "stateCode": 1869,
    "name": "Pisa",
    "countryCode": 107
  },
  {
    "stateCode": 1870,
    "name": "Pordenone",
    "countryCode": 107
  },
  {
    "stateCode": 1871,
    "name": "Potenza",
    "countryCode": 107
  },
  {
    "stateCode": 1872,
    "name": "Puglia",
    "countryCode": 107
  },
  {
    "stateCode": 1873,
    "name": "Reggio Emilia",
    "countryCode": 107
  },
  {
    "stateCode": 1874,
    "name": "Rimini",
    "countryCode": 107
  },
  {
    "stateCode": 1875,
    "name": "Roma",
    "countryCode": 107
  },
  {
    "stateCode": 1876,
    "name": "Salerno",
    "countryCode": 107
  },
  {
    "stateCode": 1877,
    "name": "Sardegna",
    "countryCode": 107
  },
  {
    "stateCode": 1878,
    "name": "Sassari",
    "countryCode": 107
  },
  {
    "stateCode": 1879,
    "name": "Savona",
    "countryCode": 107
  },
  {
    "stateCode": 1880,
    "name": "Sicilia",
    "countryCode": 107
  },
  {
    "stateCode": 1881,
    "name": "Siena",
    "countryCode": 107
  },
  {
    "stateCode": 1882,
    "name": "Sondrio",
    "countryCode": 107
  },
  {
    "stateCode": 1883,
    "name": "South Tyrol",
    "countryCode": 107
  },
  {
    "stateCode": 1884,
    "name": "Taranto",
    "countryCode": 107
  },
  {
    "stateCode": 1885,
    "name": "Teramo",
    "countryCode": 107
  },
  {
    "stateCode": 1886,
    "name": "Torino",
    "countryCode": 107
  },
  {
    "stateCode": 1887,
    "name": "Toscana",
    "countryCode": 107
  },
  {
    "stateCode": 1888,
    "name": "Trapani",
    "countryCode": 107
  },
  {
    "stateCode": 1889,
    "name": "Trentino-Alto Adige",
    "countryCode": 107
  },
  {
    "stateCode": 1890,
    "name": "Trento",
    "countryCode": 107
  },
  {
    "stateCode": 1891,
    "name": "Treviso",
    "countryCode": 107
  },
  {
    "stateCode": 1892,
    "name": "Udine",
    "countryCode": 107
  },
  {
    "stateCode": 1893,
    "name": "Umbria",
    "countryCode": 107
  },
  {
    "stateCode": 1894,
    "name": "Valle d\\Aosta, 107"
  },
  {
    "stateCode": 1895,
    "name": "Varese",
    "countryCode": 107
  },
  {
    "stateCode": 1896,
    "name": "Veneto",
    "countryCode": 107
  },
  {
    "stateCode": 1897,
    "name": "Venezia",
    "countryCode": 107
  },
  {
    "stateCode": 1898,
    "name": "Verbano-Cusio-Ossola",
    "countryCode": 107
  },
  {
    "stateCode": 1899,
    "name": "Vercelli",
    "countryCode": 107
  },
  {
    "stateCode": 1900,
    "name": "Verona",
    "countryCode": 107
  },
  {
    "stateCode": 1901,
    "name": "Vicenza",
    "countryCode": 107
  },
  {
    "stateCode": 1902,
    "name": "Viterbo",
    "countryCode": 107
  },
  {
    "stateCode": 1903,
    "name": "Buxoro Viloyati",
    "countryCode": 108
  },
  {
    "stateCode": 1904,
    "name": "Clarendon",
    "countryCode": 108
  },
  {
    "stateCode": 1905,
    "name": "Hanover",
    "countryCode": 108
  },
  {
    "stateCode": 1906,
    "name": "Kingston",
    "countryCode": 108
  },
  {
    "stateCode": 1907,
    "name": "Manchester",
    "countryCode": 108
  },
  {
    "stateCode": 1908,
    "name": "Portland",
    "countryCode": 108
  },
  {
    "stateCode": 1909,
    "name": "Saint Andrews",
    "countryCode": 108
  },
  {
    "stateCode": 1910,
    "name": "Saint Ann",
    "countryCode": 108
  },
  {
    "stateCode": 1911,
    "name": "Saint Catherine",
    "countryCode": 108
  },
  {
    "stateCode": 1912,
    "name": "Saint Elizabeth",
    "countryCode": 108
  },
  {
    "stateCode": 1913,
    "name": "Saint James",
    "countryCode": 108
  },
  {
    "stateCode": 1914,
    "name": "Saint Mary",
    "countryCode": 108
  },
  {
    "stateCode": 1915,
    "name": "Saint Thomas",
    "countryCode": 108
  },
  {
    "stateCode": 1916,
    "name": "Trelawney",
    "countryCode": 108
  },
  {
    "stateCode": 1917,
    "name": "Westmoreland",
    "countryCode": 108
  },
  {
    "stateCode": 1918,
    "name": "Aichi",
    "countryCode": 109
  },
  {
    "stateCode": 1919,
    "name": "Akita",
    "countryCode": 109
  },
  {
    "stateCode": 1920,
    "name": "Aomori",
    "countryCode": 109
  },
  {
    "stateCode": 1921,
    "name": "Chiba",
    "countryCode": 109
  },
  {
    "stateCode": 1922,
    "name": "Ehime",
    "countryCode": 109
  },
  {
    "stateCode": 1923,
    "name": "Fukui",
    "countryCode": 109
  },
  {
    "stateCode": 1924,
    "name": "Fukuoka",
    "countryCode": 109
  },
  {
    "stateCode": 1925,
    "name": "Fukushima",
    "countryCode": 109
  },
  {
    "stateCode": 1926,
    "name": "Gifu",
    "countryCode": 109
  },
  {
    "stateCode": 1927,
    "name": "Gumma",
    "countryCode": 109
  },
  {
    "stateCode": 1928,
    "name": "Hiroshima",
    "countryCode": 109
  },
  {
    "stateCode": 1929,
    "name": "Hokkaido",
    "countryCode": 109
  },
  {
    "stateCode": 1930,
    "name": "Hyogo",
    "countryCode": 109
  },
  {
    "stateCode": 1931,
    "name": "Ibaraki",
    "countryCode": 109
  },
  {
    "stateCode": 1932,
    "name": "Ishikawa",
    "countryCode": 109
  },
  {
    "stateCode": 1933,
    "name": "Iwate",
    "countryCode": 109
  },
  {
    "stateCode": 1934,
    "name": "Kagawa",
    "countryCode": 109
  },
  {
    "stateCode": 1935,
    "name": "Kagoshima",
    "countryCode": 109
  },
  {
    "stateCode": 1936,
    "name": "Kanagawa",
    "countryCode": 109
  },
  {
    "stateCode": 1937,
    "name": "Kanto",
    "countryCode": 109
  },
  {
    "stateCode": 1938,
    "name": "Kochi",
    "countryCode": 109
  },
  {
    "stateCode": 1939,
    "name": "Kumamoto",
    "countryCode": 109
  },
  {
    "stateCode": 1940,
    "name": "Kyoto",
    "countryCode": 109
  },
  {
    "stateCode": 1941,
    "name": "Mie",
    "countryCode": 109
  },
  {
    "stateCode": 1942,
    "name": "Miyagi",
    "countryCode": 109
  },
  {
    "stateCode": 1943,
    "name": "Miyazaki",
    "countryCode": 109
  },
  {
    "stateCode": 1944,
    "name": "Nagano",
    "countryCode": 109
  },
  {
    "stateCode": 1945,
    "name": "Nagasaki",
    "countryCode": 109
  },
  {
    "stateCode": 1946,
    "name": "Nara",
    "countryCode": 109
  },
  {
    "stateCode": 1947,
    "name": "Niigata",
    "countryCode": 109
  },
  {
    "stateCode": 1948,
    "name": "Oita",
    "countryCode": 109
  },
  {
    "stateCode": 1949,
    "name": "Okayama",
    "countryCode": 109
  },
  {
    "stateCode": 1950,
    "name": "Okinawa",
    "countryCode": 109
  },
  {
    "stateCode": 1951,
    "name": "Osaka",
    "countryCode": 109
  },
  {
    "stateCode": 1952,
    "name": "Saga",
    "countryCode": 109
  },
  {
    "stateCode": 1953,
    "name": "Saitama",
    "countryCode": 109
  },
  {
    "stateCode": 1954,
    "name": "Shiga",
    "countryCode": 109
  },
  {
    "stateCode": 1955,
    "name": "Shimane",
    "countryCode": 109
  },
  {
    "stateCode": 1956,
    "name": "Shizuoka",
    "countryCode": 109
  },
  {
    "stateCode": 1957,
    "name": "Tochigi",
    "countryCode": 109
  },
  {
    "stateCode": 1958,
    "name": "Tokushima",
    "countryCode": 109
  },
  {
    "stateCode": 1959,
    "name": "Tokyo",
    "countryCode": 109
  },
  {
    "stateCode": 1960,
    "name": "Tottori",
    "countryCode": 109
  },
  {
    "stateCode": 1961,
    "name": "Toyama",
    "countryCode": 109
  },
  {
    "stateCode": 1962,
    "name": "Wakayama",
    "countryCode": 109
  },
  {
    "stateCode": 1963,
    "name": "Yamagata",
    "countryCode": 109
  },
  {
    "stateCode": 1964,
    "name": "Yamaguchi",
    "countryCode": 109
  },
  {
    "stateCode": 1965,
    "name": "Yamanashi",
    "countryCode": 109
  },
  {
    "stateCode": 1966,
    "name": "Grouville",
    "countryCode": 110
  },
  {
    "stateCode": 1967,
    "name": "Saint Brelade",
    "countryCode": 110
  },
  {
    "stateCode": 1968,
    "name": "Saint Clement",
    "countryCode": 110
  },
  {
    "stateCode": 1969,
    "name": "Saint Helier",
    "countryCode": 110
  },
  {
    "stateCode": 1970,
    "name": "Saint John",
    "countryCode": 110
  },
  {
    "stateCode": 1971,
    "name": "Saint Lawrence",
    "countryCode": 110
  },
  {
    "stateCode": 1972,
    "name": "Saint Martin",
    "countryCode": 110
  },
  {
    "stateCode": 1973,
    "name": "Saint Mary",
    "countryCode": 110
  },
  {
    "stateCode": 1974,
    "name": "Saint Peter",
    "countryCode": 110
  },
  {
    "stateCode": 1975,
    "name": "Saint Saviour",
    "countryCode": 110
  },
  {
    "stateCode": 1976,
    "name": "Trinity",
    "countryCode": 110
  },
  {
    "stateCode": 1977,
    "name": "\\Ajlun, 111"
  },
  {
    "stateCode": 1978,
    "name": "Amman",
    "countryCode": 111
  },
  {
    "stateCode": 1979,
    "name": "Irbid",
    "countryCode": 111
  },
  {
    "stateCode": 1980,
    "name": "Jarash",
    "countryCode": 111
  },
  {
    "stateCode": 1981,
    "name": "Ma\\an, 111"
  },
  {
    "stateCode": 1982,
    "name": "Madaba",
    "countryCode": 111
  },
  {
    "stateCode": 1983,
    "name": "al-\\Aqabah, 111"
  },
  {
    "stateCode": 1984,
    "name": "al-Balqa\\', 111"
  },
  {
    "stateCode": 1985,
    "name": "al-Karak",
    "countryCode": 111
  },
  {
    "stateCode": 1986,
    "name": "al-Mafraq",
    "countryCode": 111
  },
  {
    "stateCode": 1987,
    "name": "at-Tafilah",
    "countryCode": 111
  },
  {
    "stateCode": 1988,
    "name": "az-Zarqa\\', 111"
  },
  {
    "stateCode": 1989,
    "name": "Akmecet",
    "countryCode": 112
  },
  {
    "stateCode": 1990,
    "name": "Akmola",
    "countryCode": 112
  },
  {
    "stateCode": 1991,
    "name": "Aktobe",
    "countryCode": 112
  },
  {
    "stateCode": 1992,
    "name": "Almati",
    "countryCode": 112
  },
  {
    "stateCode": 1993,
    "name": "Atirau",
    "countryCode": 112
  },
  {
    "stateCode": 1994,
    "name": "Batis Kazakstan",
    "countryCode": 112
  },
  {
    "stateCode": 1995,
    "name": "Burlinsky Region",
    "countryCode": 112
  },
  {
    "stateCode": 1996,
    "name": "Karagandi",
    "countryCode": 112
  },
  {
    "stateCode": 1997,
    "name": "Kostanay",
    "countryCode": 112
  },
  {
    "stateCode": 1998,
    "name": "Mankistau",
    "countryCode": 112
  },
  {
    "stateCode": 1999,
    "name": "Ontustik Kazakstan",
    "countryCode": 112
  },
  {
    "stateCode": 2000,
    "name": "Pavlodar",
    "countryCode": 112
  },
  {
    "stateCode": 2001,
    "name": "Sigis Kazakstan",
    "countryCode": 112
  },
  {
    "stateCode": 2002,
    "name": "Soltustik Kazakstan",
    "countryCode": 112
  },
  {
    "stateCode": 2003,
    "name": "Taraz",
    "countryCode": 112
  },
  {
    "stateCode": 2004,
    "name": "Central",
    "countryCode": 113
  },
  {
    "stateCode": 2005,
    "name": "Coast",
    "countryCode": 113
  },
  {
    "stateCode": 2006,
    "name": "Eastern",
    "countryCode": 113
  },
  {
    "stateCode": 2007,
    "name": "Nairobi",
    "countryCode": 113
  },
  {
    "stateCode": 2008,
    "name": "North Eastern",
    "countryCode": 113
  },
  {
    "stateCode": 2009,
    "name": "Nyanza",
    "countryCode": 113
  },
  {
    "stateCode": 2010,
    "name": "Rift Valley",
    "countryCode": 113
  },
  {
    "stateCode": 2011,
    "name": "Western",
    "countryCode": 113
  },
  {
    "stateCode": 2012,
    "name": "Abaiang",
    "countryCode": 114
  },
  {
    "stateCode": 2013,
    "name": "Abemana",
    "countryCode": 114
  },
  {
    "stateCode": 2014,
    "name": "Aranuka",
    "countryCode": 114
  },
  {
    "stateCode": 2015,
    "name": "Arorae",
    "countryCode": 114
  },
  {
    "stateCode": 2016,
    "name": "Banaba",
    "countryCode": 114
  },
  {
    "stateCode": 2017,
    "name": "Beru",
    "countryCode": 114
  },
  {
    "stateCode": 2018,
    "name": "Butaritari",
    "countryCode": 114
  },
  {
    "stateCode": 2019,
    "name": "Kiritimati",
    "countryCode": 114
  },
  {
    "stateCode": 2020,
    "name": "Kuria",
    "countryCode": 114
  },
  {
    "stateCode": 2021,
    "name": "Maiana",
    "countryCode": 114
  },
  {
    "stateCode": 2022,
    "name": "Makin",
    "countryCode": 114
  },
  {
    "stateCode": 2023,
    "name": "Marakei",
    "countryCode": 114
  },
  {
    "stateCode": 2024,
    "name": "Nikunau",
    "countryCode": 114
  },
  {
    "stateCode": 2025,
    "name": "Nonouti",
    "countryCode": 114
  },
  {
    "stateCode": 2026,
    "name": "Onotoa",
    "countryCode": 114
  },
  {
    "stateCode": 2027,
    "name": "Phoenix Islands",
    "countryCode": 114
  },
  {
    "stateCode": 2028,
    "name": "Tabiteuea North",
    "countryCode": 114
  },
  {
    "stateCode": 2029,
    "name": "Tabiteuea South",
    "countryCode": 114
  },
  {
    "stateCode": 2030,
    "name": "Tabuaeran",
    "countryCode": 114
  },
  {
    "stateCode": 2031,
    "name": "Tamana",
    "countryCode": 114
  },
  {
    "stateCode": 2032,
    "name": "Tarawa North",
    "countryCode": 114
  },
  {
    "stateCode": 2033,
    "name": "Tarawa South",
    "countryCode": 114
  },
  {
    "stateCode": 2034,
    "name": "Teraina",
    "countryCode": 114
  },
  {
    "stateCode": 2035,
    "name": "Chagangdo",
    "countryCode": 115
  },
  {
    "stateCode": 2036,
    "name": "Hamgyeongbukto",
    "countryCode": 115
  },
  {
    "stateCode": 2037,
    "name": "Hamgyeongnamdo",
    "countryCode": 115
  },
  {
    "stateCode": 2038,
    "name": "Hwanghaebukto",
    "countryCode": 115
  },
  {
    "stateCode": 2039,
    "name": "Hwanghaenamdo",
    "countryCode": 115
  },
  {
    "stateCode": 2040,
    "name": "Kaeseong",
    "countryCode": 115
  },
  {
    "stateCode": 2041,
    "name": "Kangweon",
    "countryCode": 115
  },
  {
    "stateCode": 2042,
    "name": "Nampo",
    "countryCode": 115
  },
  {
    "stateCode": 2043,
    "name": "Pyeonganbukto",
    "countryCode": 115
  },
  {
    "stateCode": 2044,
    "name": "Pyeongannamdo",
    "countryCode": 115
  },
  {
    "stateCode": 2045,
    "name": "Pyeongyang",
    "countryCode": 115
  },
  {
    "stateCode": 2046,
    "name": "Yanggang",
    "countryCode": 115
  },
  {
    "stateCode": 2047,
    "name": "Busan",
    "countryCode": 116
  },
  {
    "stateCode": 2048,
    "name": "Cheju",
    "countryCode": 116
  },
  {
    "stateCode": 2049,
    "name": "Chollabuk",
    "countryCode": 116
  },
  {
    "stateCode": 2050,
    "name": "Chollanam",
    "countryCode": 116
  },
  {
    "stateCode": 2051,
    "name": "Chungbuk",
    "countryCode": 116
  },
  {
    "stateCode": 2052,
    "name": "Chungcheongbuk",
    "countryCode": 116
  },
  {
    "stateCode": 2053,
    "name": "Chungcheongnam",
    "countryCode": 116
  },
  {
    "stateCode": 2054,
    "name": "Chungnam",
    "countryCode": 116
  },
  {
    "stateCode": 2055,
    "name": "Daegu",
    "countryCode": 116
  },
  {
    "stateCode": 2056,
    "name": "Gangwon-do",
    "countryCode": 116
  },
  {
    "stateCode": 2057,
    "name": "Goyang-si",
    "countryCode": 116
  },
  {
    "stateCode": 2058,
    "name": "Gyeonggi-do",
    "countryCode": 116
  },
  {
    "stateCode": 2059,
    "name": "Gyeongsang",
    "countryCode": 116
  },
  {
    "stateCode": 2060,
    "name": "Gyeongsangnam-do",
    "countryCode": 116
  },
  {
    "stateCode": 2061,
    "name": "Incheon",
    "countryCode": 116
  },
  {
    "stateCode": 2062,
    "name": "Jeju-Si",
    "countryCode": 116
  },
  {
    "stateCode": 2063,
    "name": "Jeonbuk",
    "countryCode": 116
  },
  {
    "stateCode": 2064,
    "name": "Kangweon",
    "countryCode": 116
  },
  {
    "stateCode": 2065,
    "name": "Kwangju",
    "countryCode": 116
  },
  {
    "stateCode": 2066,
    "name": "Kyeonggi",
    "countryCode": 116
  },
  {
    "stateCode": 2067,
    "name": "Kyeongsangbuk",
    "countryCode": 116
  },
  {
    "stateCode": 2068,
    "name": "Kyeongsangnam",
    "countryCode": 116
  },
  {
    "stateCode": 2069,
    "name": "Kyonggi-do",
    "countryCode": 116
  },
  {
    "stateCode": 2070,
    "name": "Kyungbuk-Do",
    "countryCode": 116
  },
  {
    "stateCode": 2071,
    "name": "Kyunggi-Do",
    "countryCode": 116
  },
  {
    "stateCode": 2072,
    "name": "Kyunggi-do",
    "countryCode": 116
  },
  {
    "stateCode": 2073,
    "name": "Pusan",
    "countryCode": 116
  },
  {
    "stateCode": 2074,
    "name": "Seoul",
    "countryCode": 116
  },
  {
    "stateCode": 2075,
    "name": "Sudogwon",
    "countryCode": 116
  },
  {
    "stateCode": 2076,
    "name": "Taegu",
    "countryCode": 116
  },
  {
    "stateCode": 2077,
    "name": "Taejeon",
    "countryCode": 116
  },
  {
    "stateCode": 2078,
    "name": "Taejon-gwangyoksi",
    "countryCode": 116
  },
  {
    "stateCode": 2079,
    "name": "Ulsan",
    "countryCode": 116
  },
  {
    "stateCode": 2080,
    "name": "Wonju",
    "countryCode": 116
  },
  {
    "stateCode": 2081,
    "name": "gwangyoksi",
    "countryCode": 116
  },
  {
    "stateCode": 2082,
    "name": "Al Asimah",
    "countryCode": 117
  },
  {
    "stateCode": 2083,
    "name": "Hawalli",
    "countryCode": 117
  },
  {
    "stateCode": 2084,
    "name": "Mishref",
    "countryCode": 117
  },
  {
    "stateCode": 2085,
    "name": "Qadesiya",
    "countryCode": 117
  },
  {
    "stateCode": 2086,
    "name": "Safat",
    "countryCode": 117
  },
  {
    "stateCode": 2087,
    "name": "Salmiya",
    "countryCode": 117
  },
  {
    "stateCode": 2088,
    "name": "al-Ahmadi",
    "countryCode": 117
  },
  {
    "stateCode": 2089,
    "name": "al-Farwaniyah",
    "countryCode": 117
  },
  {
    "stateCode": 2090,
    "name": "al-Jahra",
    "countryCode": 117
  },
  {
    "stateCode": 2091,
    "name": "al-Kuwayt",
    "countryCode": 117
  },
  {
    "stateCode": 2092,
    "name": "Batken",
    "countryCode": 118
  },
  {
    "stateCode": 2093,
    "name": "Bishkek",
    "countryCode": 118
  },
  {
    "stateCode": 2094,
    "name": "Chui",
    "countryCode": 118
  },
  {
    "stateCode": 2095,
    "name": "Issyk-Kul",
    "countryCode": 118
  },
  {
    "stateCode": 2096,
    "name": "Jalal-Abad",
    "countryCode": 118
  },
  {
    "stateCode": 2097,
    "name": "Naryn",
    "countryCode": 118
  },
  {
    "stateCode": 2098,
    "name": "Osh",
    "countryCode": 118
  },
  {
    "stateCode": 2099,
    "name": "Talas",
    "countryCode": 118
  },
  {
    "stateCode": 2100,
    "name": "Attopu",
    "countryCode": 119
  },
  {
    "stateCode": 2101,
    "name": "Bokeo",
    "countryCode": 119
  },
  {
    "stateCode": 2102,
    "name": "Bolikhamsay",
    "countryCode": 119
  },
  {
    "stateCode": 2103,
    "name": "Champasak",
    "countryCode": 119
  },
  {
    "stateCode": 2104,
    "name": "Houaphanh",
    "countryCode": 119
  },
  {
    "stateCode": 2105,
    "name": "Khammouane",
    "countryCode": 119
  },
  {
    "stateCode": 2106,
    "name": "Luang Nam Tha",
    "countryCode": 119
  },
  {
    "stateCode": 2107,
    "name": "Luang Prabang",
    "countryCode": 119
  },
  {
    "stateCode": 2108,
    "name": "Oudomxay",
    "countryCode": 119
  },
  {
    "stateCode": 2109,
    "name": "Phongsaly",
    "countryCode": 119
  },
  {
    "stateCode": 2110,
    "name": "Saravan",
    "countryCode": 119
  },
  {
    "stateCode": 2111,
    "name": "Savannakhet",
    "countryCode": 119
  },
  {
    "stateCode": 2112,
    "name": "Sekong",
    "countryCode": 119
  },
  {
    "stateCode": 2113,
    "name": "Viangchan Prefecture",
    "countryCode": 119
  },
  {
    "stateCode": 2114,
    "name": "Viangchan Province",
    "countryCode": 119
  },
  {
    "stateCode": 2115,
    "name": "Xaignabury",
    "countryCode": 119
  },
  {
    "stateCode": 2116,
    "name": "Xiang Khuang",
    "countryCode": 119
  },
  {
    "stateCode": 2117,
    "name": "Aizkraukles",
    "countryCode": 120
  },
  {
    "stateCode": 2118,
    "name": "Aluksnes",
    "countryCode": 120
  },
  {
    "stateCode": 2119,
    "name": "Balvu",
    "countryCode": 120
  },
  {
    "stateCode": 2120,
    "name": "Bauskas",
    "countryCode": 120
  },
  {
    "stateCode": 2121,
    "name": "Cesu",
    "countryCode": 120
  },
  {
    "stateCode": 2122,
    "name": "Daugavpils",
    "countryCode": 120
  },
  {
    "stateCode": 2123,
    "name": "Daugavpils City",
    "countryCode": 120
  },
  {
    "stateCode": 2124,
    "name": "Dobeles",
    "countryCode": 120
  },
  {
    "stateCode": 2125,
    "name": "Gulbenes",
    "countryCode": 120
  },
  {
    "stateCode": 2126,
    "name": "Jekabspils",
    "countryCode": 120
  },
  {
    "stateCode": 2127,
    "name": "Jelgava",
    "countryCode": 120
  },
  {
    "stateCode": 2128,
    "name": "Jelgavas",
    "countryCode": 120
  },
  {
    "stateCode": 2129,
    "name": "Jurmala City",
    "countryCode": 120
  },
  {
    "stateCode": 2130,
    "name": "Kraslavas",
    "countryCode": 120
  },
  {
    "stateCode": 2131,
    "name": "Kuldigas",
    "countryCode": 120
  },
  {
    "stateCode": 2132,
    "name": "Liepaja",
    "countryCode": 120
  },
  {
    "stateCode": 2133,
    "name": "Liepajas",
    "countryCode": 120
  },
  {
    "stateCode": 2134,
    "name": "Limbazhu",
    "countryCode": 120
  },
  {
    "stateCode": 2135,
    "name": "Ludzas",
    "countryCode": 120
  },
  {
    "stateCode": 2136,
    "name": "Madonas",
    "countryCode": 120
  },
  {
    "stateCode": 2137,
    "name": "Ogres",
    "countryCode": 120
  },
  {
    "stateCode": 2138,
    "name": "Preilu",
    "countryCode": 120
  },
  {
    "stateCode": 2139,
    "name": "Rezekne",
    "countryCode": 120
  },
  {
    "stateCode": 2140,
    "name": "Rezeknes",
    "countryCode": 120
  },
  {
    "stateCode": 2141,
    "name": "Riga",
    "countryCode": 120
  },
  {
    "stateCode": 2142,
    "name": "Rigas",
    "countryCode": 120
  },
  {
    "stateCode": 2143,
    "name": "Saldus",
    "countryCode": 120
  },
  {
    "stateCode": 2144,
    "name": "Talsu",
    "countryCode": 120
  },
  {
    "stateCode": 2145,
    "name": "Tukuma",
    "countryCode": 120
  },
  {
    "stateCode": 2146,
    "name": "Valkas",
    "countryCode": 120
  },
  {
    "stateCode": 2147,
    "name": "Valmieras",
    "countryCode": 120
  },
  {
    "stateCode": 2148,
    "name": "Ventspils",
    "countryCode": 120
  },
  {
    "stateCode": 2149,
    "name": "Ventspils City",
    "countryCode": 120
  },
  {
    "stateCode": 2150,
    "name": "Beirut",
    "countryCode": 121
  },
  {
    "stateCode": 2151,
    "name": "Jabal Lubnan",
    "countryCode": 121
  },
  {
    "stateCode": 2152,
    "name": "Mohafazat Liban-Nord",
    "countryCode": 121
  },
  {
    "stateCode": 2153,
    "name": "Mohafazat Mont-Liban",
    "countryCode": 121
  },
  {
    "stateCode": 2154,
    "name": "Sidon",
    "countryCode": 121
  },
  {
    "stateCode": 2155,
    "name": "al-Biqa",
    "countryCode": 121
  },
  {
    "stateCode": 2156,
    "name": "al-Janub",
    "countryCode": 121
  },
  {
    "stateCode": 2157,
    "name": "an-Nabatiyah",
    "countryCode": 121
  },
  {
    "stateCode": 2158,
    "name": "ash-Shamal",
    "countryCode": 121
  },
  {
    "stateCode": 2159,
    "name": "Berea",
    "countryCode": 122
  },
  {
    "stateCode": 2160,
    "name": "Butha-Buthe",
    "countryCode": 122
  },
  {
    "stateCode": 2161,
    "name": "Leribe",
    "countryCode": 122
  },
  {
    "stateCode": 2162,
    "name": "Mafeteng",
    "countryCode": 122
  },
  {
    "stateCode": 2163,
    "name": "Maseru",
    "countryCode": 122
  },
  {
    "stateCode": 2164,
    "name": "Mohale\\s Hoek, 122"
  },
  {
    "stateCode": 2165,
    "name": "Mokhotlong",
    "countryCode": 122
  },
  {
    "stateCode": 2166,
    "name": "Qacha\\s Nek, 122"
  },
  {
    "stateCode": 2167,
    "name": "Quthing",
    "countryCode": 122
  },
  {
    "stateCode": 2168,
    "name": "Thaba-Tseka",
    "countryCode": 122
  },
  {
    "stateCode": 2169,
    "name": "Bomi",
    "countryCode": 123
  },
  {
    "stateCode": 2170,
    "name": "Bong",
    "countryCode": 123
  },
  {
    "stateCode": 2171,
    "name": "Grand Bassa",
    "countryCode": 123
  },
  {
    "stateCode": 2172,
    "name": "Grand Cape Mount",
    "countryCode": 123
  },
  {
    "stateCode": 2173,
    "name": "Grand Gedeh",
    "countryCode": 123
  },
  {
    "stateCode": 2174,
    "name": "Loffa",
    "countryCode": 123
  },
  {
    "stateCode": 2175,
    "name": "Margibi",
    "countryCode": 123
  },
  {
    "stateCode": 2176,
    "name": "Maryland and Grand Kru",
    "countryCode": 123
  },
  {
    "stateCode": 2177,
    "name": "Montserrado",
    "countryCode": 123
  },
  {
    "stateCode": 2178,
    "name": "Nimba",
    "countryCode": 123
  },
  {
    "stateCode": 2179,
    "name": "Rivercess",
    "countryCode": 123
  },
  {
    "stateCode": 2180,
    "name": "Sinoe",
    "countryCode": 123
  },
  {
    "stateCode": 2181,
    "name": "Ajdabiya",
    "countryCode": 124
  },
  {
    "stateCode": 2183,
    "name": "Banghazi",
    "countryCode": 124
  },
  {
    "stateCode": 2184,
    "name": "Darnah",
    "countryCode": 124
  },
  {
    "stateCode": 2185,
    "name": "Ghadamis",
    "countryCode": 124
  },
  {
    "stateCode": 2186,
    "name": "Gharyan",
    "countryCode": 124
  },
  {
    "stateCode": 2187,
    "name": "Misratah",
    "countryCode": 124
  },
  {
    "stateCode": 2188,
    "name": "Murzuq",
    "countryCode": 124
  },
  {
    "stateCode": 2189,
    "name": "Sabha",
    "countryCode": 124
  },
  {
    "stateCode": 2190,
    "name": "Sawfajjin",
    "countryCode": 124
  },
  {
    "stateCode": 2191,
    "name": "Surt",
    "countryCode": 124
  },
  {
    "stateCode": 2192,
    "name": "Tarabulus",
    "countryCode": 124
  },
  {
    "stateCode": 2193,
    "name": "Tarhunah",
    "countryCode": 124
  },
  {
    "stateCode": 2194,
    "name": "Tripolitania",
    "countryCode": 124
  },
  {
    "stateCode": 2195,
    "name": "Tubruq",
    "countryCode": 124
  },
  {
    "stateCode": 2196,
    "name": "Yafran",
    "countryCode": 124
  },
  {
    "stateCode": 2197,
    "name": "Zlitan",
    "countryCode": 124
  },
  {
    "stateCode": 2198,
    "name": "al-\\Aziziyah, 124"
  },
  {
    "stateCode": 2199,
    "name": "al-Fatih",
    "countryCode": 124
  },
  {
    "stateCode": 2200,
    "name": "al-Jabal al Akhdar",
    "countryCode": 124
  },
  {
    "stateCode": 2201,
    "name": "al-Jufrah",
    "countryCode": 124
  },
  {
    "stateCode": 2202,
    "name": "al-Khums",
    "countryCode": 124
  },
  {
    "stateCode": 2203,
    "name": "al-Kufrah",
    "countryCode": 124
  },
  {
    "stateCode": 2204,
    "name": "an-Nuqat al-Khams",
    "countryCode": 124
  },
  {
    "stateCode": 2205,
    "name": "ash-Shati\\', 124"
  },
  {
    "stateCode": 2206,
    "name": "az-Zawiyah",
    "countryCode": 124
  },
  {
    "stateCode": 2207,
    "name": "Balzers",
    "countryCode": 125
  },
  {
    "stateCode": 2208,
    "name": "Eschen",
    "countryCode": 125
  },
  {
    "stateCode": 2209,
    "name": "Gamprin",
    "countryCode": 125
  },
  {
    "stateCode": 2210,
    "name": "Mauren",
    "countryCode": 125
  },
  {
    "stateCode": 2211,
    "name": "Planken",
    "countryCode": 125
  },
  {
    "stateCode": 2212,
    "name": "Ruggell",
    "countryCode": 125
  },
  {
    "stateCode": 2213,
    "name": "Schaan",
    "countryCode": 125
  },
  {
    "stateCode": 2214,
    "name": "Schellenberg",
    "countryCode": 125
  },
  {
    "stateCode": 2215,
    "name": "Triesen",
    "countryCode": 125
  },
  {
    "stateCode": 2216,
    "name": "Triesenberg",
    "countryCode": 125
  },
  {
    "stateCode": 2217,
    "name": "Vaduz",
    "countryCode": 125
  },
  {
    "stateCode": 2218,
    "name": "Alytaus",
    "countryCode": 126
  },
  {
    "stateCode": 2219,
    "name": "Anyksciai",
    "countryCode": 126
  },
  {
    "stateCode": 2220,
    "name": "Kauno",
    "countryCode": 126
  },
  {
    "stateCode": 2221,
    "name": "Klaipedos",
    "countryCode": 126
  },
  {
    "stateCode": 2222,
    "name": "Marijampoles",
    "countryCode": 126
  },
  {
    "stateCode": 2223,
    "name": "Panevezhio",
    "countryCode": 126
  },
  {
    "stateCode": 2224,
    "name": "Panevezys",
    "countryCode": 126
  },
  {
    "stateCode": 2225,
    "name": "Shiauliu",
    "countryCode": 126
  },
  {
    "stateCode": 2226,
    "name": "Taurages",
    "countryCode": 126
  },
  {
    "stateCode": 2227,
    "name": "Telshiu",
    "countryCode": 126
  },
  {
    "stateCode": 2228,
    "name": "Telsiai",
    "countryCode": 126
  },
  {
    "stateCode": 2229,
    "name": "Utenos",
    "countryCode": 126
  },
  {
    "stateCode": 2230,
    "name": "Vilniaus",
    "countryCode": 126
  },
  {
    "stateCode": 2231,
    "name": "Capellen",
    "countryCode": 127
  },
  {
    "stateCode": 2232,
    "name": "Clervaux",
    "countryCode": 127
  },
  {
    "stateCode": 2233,
    "name": "Diekirch",
    "countryCode": 127
  },
  {
    "stateCode": 2234,
    "name": "Echternach",
    "countryCode": 127
  },
  {
    "stateCode": 2235,
    "name": "Esch-sur-Alzette",
    "countryCode": 127
  },
  {
    "stateCode": 2236,
    "name": "Grevenmacher",
    "countryCode": 127
  },
  {
    "stateCode": 2237,
    "name": "Luxembourg",
    "countryCode": 127
  },
  {
    "stateCode": 2238,
    "name": "Mersch",
    "countryCode": 127
  },
  {
    "stateCode": 2239,
    "name": "Redange",
    "countryCode": 127
  },
  {
    "stateCode": 2240,
    "name": "Remich",
    "countryCode": 127
  },
  {
    "stateCode": 2241,
    "name": "Vianden",
    "countryCode": 127
  },
  {
    "stateCode": 2242,
    "name": "Wiltz",
    "countryCode": 127
  },
  {
    "stateCode": 2243,
    "name": "Macau",
    "countryCode": 128
  },
  {
    "stateCode": 2244,
    "name": "Berovo",
    "countryCode": 129
  },
  {
    "stateCode": 2245,
    "name": "Bitola",
    "countryCode": 129
  },
  {
    "stateCode": 2246,
    "name": "Brod",
    "countryCode": 129
  },
  {
    "stateCode": 2247,
    "name": "Debar",
    "countryCode": 129
  },
  {
    "stateCode": 2248,
    "name": "Delchevo",
    "countryCode": 129
  },
  {
    "stateCode": 2249,
    "name": "Demir Hisar",
    "countryCode": 129
  },
  {
    "stateCode": 2250,
    "name": "Gevgelija",
    "countryCode": 129
  },
  {
    "stateCode": 2251,
    "name": "Gostivar",
    "countryCode": 129
  },
  {
    "stateCode": 2252,
    "name": "Kavadarci",
    "countryCode": 129
  },
  {
    "stateCode": 2253,
    "name": "Kichevo",
    "countryCode": 129
  },
  {
    "stateCode": 2254,
    "name": "Kochani",
    "countryCode": 129
  },
  {
    "stateCode": 2255,
    "name": "Kratovo",
    "countryCode": 129
  },
  {
    "stateCode": 2256,
    "name": "Kriva Palanka",
    "countryCode": 129
  },
  {
    "stateCode": 2257,
    "name": "Krushevo",
    "countryCode": 129
  },
  {
    "stateCode": 2258,
    "name": "Kumanovo",
    "countryCode": 129
  },
  {
    "stateCode": 2259,
    "name": "Negotino",
    "countryCode": 129
  },
  {
    "stateCode": 2260,
    "name": "Ohrid",
    "countryCode": 129
  },
  {
    "stateCode": 2261,
    "name": "Prilep",
    "countryCode": 129
  },
  {
    "stateCode": 2262,
    "name": "Probishtip",
    "countryCode": 129
  },
  {
    "stateCode": 2263,
    "name": "Radovish",
    "countryCode": 129
  },
  {
    "stateCode": 2264,
    "name": "Resen",
    "countryCode": 129
  },
  {
    "stateCode": 2265,
    "name": "Shtip",
    "countryCode": 129
  },
  {
    "stateCode": 2266,
    "name": "Skopje",
    "countryCode": 129
  },
  {
    "stateCode": 2267,
    "name": "Struga",
    "countryCode": 129
  },
  {
    "stateCode": 2268,
    "name": "Strumica",
    "countryCode": 129
  },
  {
    "stateCode": 2269,
    "name": "Sveti Nikole",
    "countryCode": 129
  },
  {
    "stateCode": 2270,
    "name": "Tetovo",
    "countryCode": 129
  },
  {
    "stateCode": 2271,
    "name": "Valandovo",
    "countryCode": 129
  },
  {
    "stateCode": 2272,
    "name": "Veles",
    "countryCode": 129
  },
  {
    "stateCode": 2273,
    "name": "Vinica",
    "countryCode": 129
  },
  {
    "stateCode": 2274,
    "name": "Antananarivo",
    "countryCode": 130
  },
  {
    "stateCode": 2275,
    "name": "Antsiranana",
    "countryCode": 130
  },
  {
    "stateCode": 2276,
    "name": "Fianarantsoa",
    "countryCode": 130
  },
  {
    "stateCode": 2277,
    "name": "Mahajanga",
    "countryCode": 130
  },
  {
    "stateCode": 2278,
    "name": "Toamasina",
    "countryCode": 130
  },
  {
    "stateCode": 2279,
    "name": "Toliary",
    "countryCode": 130
  },
  {
    "stateCode": 2280,
    "name": "Balaka",
    "countryCode": 131
  },
  {
    "stateCode": 2281,
    "name": "Blantyre City",
    "countryCode": 131
  },
  {
    "stateCode": 2282,
    "name": "Chikwawa",
    "countryCode": 131
  },
  {
    "stateCode": 2283,
    "name": "Chiradzulu",
    "countryCode": 131
  },
  {
    "stateCode": 2284,
    "name": "Chitipa",
    "countryCode": 131
  },
  {
    "stateCode": 2285,
    "name": "Dedza",
    "countryCode": 131
  },
  {
    "stateCode": 2286,
    "name": "Dowa",
    "countryCode": 131
  },
  {
    "stateCode": 2287,
    "name": "Karonga",
    "countryCode": 131
  },
  {
    "stateCode": 2288,
    "name": "Kasungu",
    "countryCode": 131
  },
  {
    "stateCode": 2289,
    "name": "Lilongwe City",
    "countryCode": 131
  },
  {
    "stateCode": 2290,
    "name": "Machinga",
    "countryCode": 131
  },
  {
    "stateCode": 2291,
    "name": "Mangochi",
    "countryCode": 131
  },
  {
    "stateCode": 2292,
    "name": "Mchinji",
    "countryCode": 131
  },
  {
    "stateCode": 2293,
    "name": "Mulanje",
    "countryCode": 131
  },
  {
    "stateCode": 2294,
    "name": "Mwanza",
    "countryCode": 131
  },
  {
    "stateCode": 2295,
    "name": "Mzimba",
    "countryCode": 131
  },
  {
    "stateCode": 2296,
    "name": "Mzuzu City",
    "countryCode": 131
  },
  {
    "stateCode": 2297,
    "name": "Nkhata Bay",
    "countryCode": 131
  },
  {
    "stateCode": 2298,
    "name": "Nkhotakota",
    "countryCode": 131
  },
  {
    "stateCode": 2299,
    "name": "Nsanje",
    "countryCode": 131
  },
  {
    "stateCode": 2300,
    "name": "Ntcheu",
    "countryCode": 131
  },
  {
    "stateCode": 2301,
    "name": "Ntchisi",
    "countryCode": 131
  },
  {
    "stateCode": 2302,
    "name": "Phalombe",
    "countryCode": 131
  },
  {
    "stateCode": 2303,
    "name": "Rumphi",
    "countryCode": 131
  },
  {
    "stateCode": 2304,
    "name": "Salima",
    "countryCode": 131
  },
  {
    "stateCode": 2305,
    "name": "Thyolo",
    "countryCode": 131
  },
  {
    "stateCode": 2306,
    "name": "Zomba Municipality",
    "countryCode": 131
  },
  {
    "stateCode": 2307,
    "name": "Johor",
    "countryCode": 132
  },
  {
    "stateCode": 2308,
    "name": "Kedah",
    "countryCode": 132
  },
  {
    "stateCode": 2309,
    "name": "Kelantan",
    "countryCode": 132
  },
  {
    "stateCode": 2310,
    "name": "Kuala Lumpur",
    "countryCode": 132
  },
  {
    "stateCode": 2311,
    "name": "Labuan",
    "countryCode": 132
  },
  {
    "stateCode": 2312,
    "name": "Melaka",
    "countryCode": 132
  },
  {
    "stateCode": 2313,
    "name": "Negeri Johor",
    "countryCode": 132
  },
  {
    "stateCode": 2314,
    "name": "Negeri Sembilan",
    "countryCode": 132
  },
  {
    "stateCode": 2315,
    "name": "Pahang",
    "countryCode": 132
  },
  {
    "stateCode": 2316,
    "name": "Penang",
    "countryCode": 132
  },
  {
    "stateCode": 2317,
    "name": "Perak",
    "countryCode": 132
  },
  {
    "stateCode": 2318,
    "name": "Perlis",
    "countryCode": 132
  },
  {
    "stateCode": 2319,
    "name": "Pulau Pinang",
    "countryCode": 132
  },
  {
    "stateCode": 2320,
    "name": "Sabah",
    "countryCode": 132
  },
  {
    "stateCode": 2321,
    "name": "Sarawak",
    "countryCode": 132
  },
  {
    "stateCode": 2322,
    "name": "Selangor",
    "countryCode": 132
  },
  {
    "stateCode": 2323,
    "name": "Sembilan",
    "countryCode": 132
  },
  {
    "stateCode": 2324,
    "name": "Terengganu",
    "countryCode": 132
  },
  {
    "stateCode": 2325,
    "name": "Alif Alif",
    "countryCode": 133
  },
  {
    "stateCode": 2326,
    "name": "Alif Dhaal",
    "countryCode": 133
  },
  {
    "stateCode": 2327,
    "name": "Baa",
    "countryCode": 133
  },
  {
    "stateCode": 2328,
    "name": "Dhaal",
    "countryCode": 133
  },
  {
    "stateCode": 2329,
    "name": "Faaf",
    "countryCode": 133
  },
  {
    "stateCode": 2330,
    "name": "Gaaf Alif",
    "countryCode": 133
  },
  {
    "stateCode": 2331,
    "name": "Gaaf Dhaal",
    "countryCode": 133
  },
  {
    "stateCode": 2332,
    "name": "Ghaviyani",
    "countryCode": 133
  },
  {
    "stateCode": 2333,
    "name": "Haa Alif",
    "countryCode": 133
  },
  {
    "stateCode": 2334,
    "name": "Haa Dhaal",
    "countryCode": 133
  },
  {
    "stateCode": 2335,
    "name": "Kaaf",
    "countryCode": 133
  },
  {
    "stateCode": 2336,
    "name": "Laam",
    "countryCode": 133
  },
  {
    "stateCode": 2337,
    "name": "Lhaviyani",
    "countryCode": 133
  },
  {
    "stateCode": 2338,
    "name": "Male",
    "countryCode": 133
  },
  {
    "stateCode": 2339,
    "name": "Miim",
    "countryCode": 133
  },
  {
    "stateCode": 2340,
    "name": "Nuun",
    "countryCode": 133
  },
  {
    "stateCode": 2341,
    "name": "Raa",
    "countryCode": 133
  },
  {
    "stateCode": 2342,
    "name": "Shaviyani",
    "countryCode": 133
  },
  {
    "stateCode": 2343,
    "name": "Siin",
    "countryCode": 133
  },
  {
    "stateCode": 2344,
    "name": "Thaa",
    "countryCode": 133
  },
  {
    "stateCode": 2345,
    "name": "Vaav",
    "countryCode": 133
  },
  {
    "stateCode": 2346,
    "name": "Bamako",
    "countryCode": 134
  },
  {
    "stateCode": 2347,
    "name": "Gao",
    "countryCode": 134
  },
  {
    "stateCode": 2348,
    "name": "Kayes",
    "countryCode": 134
  },
  {
    "stateCode": 2349,
    "name": "Kidal",
    "countryCode": 134
  },
  {
    "stateCode": 2350,
    "name": "Koulikoro",
    "countryCode": 134
  },
  {
    "stateCode": 2351,
    "name": "Mopti",
    "countryCode": 134
  },
  {
    "stateCode": 2352,
    "name": "Segou",
    "countryCode": 134
  },
  {
    "stateCode": 2353,
    "name": "Sikasso",
    "countryCode": 134
  },
  {
    "stateCode": 2354,
    "name": "Tombouctou",
    "countryCode": 134
  },
  {
    "stateCode": 2355,
    "name": "Gozo and Comino",
    "countryCode": 135
  },
  {
    "stateCode": 2356,
    "name": "Inner Harbour",
    "countryCode": 135
  },
  {
    "stateCode": 2357,
    "name": "Northern",
    "countryCode": 135
  },
  {
    "stateCode": 2358,
    "name": "Outer Harbour",
    "countryCode": 135
  },
  {
    "stateCode": 2359,
    "name": "South Eastern",
    "countryCode": 135
  },
  {
    "stateCode": 2360,
    "name": "Valletta",
    "countryCode": 135
  },
  {
    "stateCode": 2361,
    "name": "Western",
    "countryCode": 135
  },
  {
    "stateCode": 2362,
    "name": "Castletown",
    "countryCode": 136
  },
  {
    "stateCode": 2363,
    "name": "Douglas",
    "countryCode": 136
  },
  {
    "stateCode": 2364,
    "name": "Laxey",
    "countryCode": 136
  },
  {
    "stateCode": 2365,
    "name": "Onchan",
    "countryCode": 136
  },
  {
    "stateCode": 2366,
    "name": "Peel",
    "countryCode": 136
  },
  {
    "stateCode": 2367,
    "name": "Port Erin",
    "countryCode": 136
  },
  {
    "stateCode": 2368,
    "name": "Port Saint Mary",
    "countryCode": 136
  },
  {
    "stateCode": 2369,
    "name": "Ramsey",
    "countryCode": 136
  },
  {
    "stateCode": 2370,
    "name": "Ailinlaplap",
    "countryCode": 137
  },
  {
    "stateCode": 2371,
    "name": "Ailuk",
    "countryCode": 137
  },
  {
    "stateCode": 2372,
    "name": "Arno",
    "countryCode": 137
  },
  {
    "stateCode": 2373,
    "name": "Aur",
    "countryCode": 137
  },
  {
    "stateCode": 2374,
    "name": "Bikini",
    "countryCode": 137
  },
  {
    "stateCode": 2375,
    "name": "Ebon",
    "countryCode": 137
  },
  {
    "stateCode": 2376,
    "name": "Enewetak",
    "countryCode": 137
  },
  {
    "stateCode": 2377,
    "name": "Jabat",
    "countryCode": 137
  },
  {
    "stateCode": 2378,
    "name": "Jaluit",
    "countryCode": 137
  },
  {
    "stateCode": 2379,
    "name": "Kili",
    "countryCode": 137
  },
  {
    "stateCode": 2380,
    "name": "Kwajalein",
    "countryCode": 137
  },
  {
    "stateCode": 2381,
    "name": "Lae",
    "countryCode": 137
  },
  {
    "stateCode": 2382,
    "name": "Lib",
    "countryCode": 137
  },
  {
    "stateCode": 2383,
    "name": "Likiep",
    "countryCode": 137
  },
  {
    "stateCode": 2384,
    "name": "Majuro",
    "countryCode": 137
  },
  {
    "stateCode": 2385,
    "name": "Maloelap",
    "countryCode": 137
  },
  {
    "stateCode": 2386,
    "name": "Mejit",
    "countryCode": 137
  },
  {
    "stateCode": 2387,
    "name": "Mili",
    "countryCode": 137
  },
  {
    "stateCode": 2388,
    "name": "Namorik",
    "countryCode": 137
  },
  {
    "stateCode": 2389,
    "name": "Namu",
    "countryCode": 137
  },
  {
    "stateCode": 2390,
    "name": "Rongelap",
    "countryCode": 137
  },
  {
    "stateCode": 2391,
    "name": "Ujae",
    "countryCode": 137
  },
  {
    "stateCode": 2392,
    "name": "Utrik",
    "countryCode": 137
  },
  {
    "stateCode": 2393,
    "name": "Wotho",
    "countryCode": 137
  },
  {
    "stateCode": 2394,
    "name": "Wotje",
    "countryCode": 137
  },
  {
    "stateCode": 2395,
    "name": "Fort-de-France",
    "countryCode": 138
  },
  {
    "stateCode": 2396,
    "name": "La Trinite",
    "countryCode": 138
  },
  {
    "stateCode": 2397,
    "name": "Le Marin",
    "countryCode": 138
  },
  {
    "stateCode": 2398,
    "name": "Saint-Pierre",
    "countryCode": 138
  },
  {
    "stateCode": 2399,
    "name": "Adrar",
    "countryCode": 139
  },
  {
    "stateCode": 2400,
    "name": "Assaba",
    "countryCode": 139
  },
  {
    "stateCode": 2401,
    "name": "Brakna",
    "countryCode": 139
  },
  {
    "stateCode": 2402,
    "name": "Dhakhlat Nawadibu",
    "countryCode": 139
  },
  {
    "stateCode": 2403,
    "name": "Hudh-al-Gharbi",
    "countryCode": 139
  },
  {
    "stateCode": 2404,
    "name": "Hudh-ash-Sharqi",
    "countryCode": 139
  },
  {
    "stateCode": 2405,
    "name": "Inshiri",
    "countryCode": 139
  },
  {
    "stateCode": 2406,
    "name": "Nawakshut",
    "countryCode": 139
  },
  {
    "stateCode": 2407,
    "name": "Qidimagha",
    "countryCode": 139
  },
  {
    "stateCode": 2408,
    "name": "Qurqul",
    "countryCode": 139
  },
  {
    "stateCode": 2409,
    "name": "Taqant",
    "countryCode": 139
  },
  {
    "stateCode": 2410,
    "name": "Tiris Zammur",
    "countryCode": 139
  },
  {
    "stateCode": 2411,
    "name": "Trarza",
    "countryCode": 139
  },
  {
    "stateCode": 2412,
    "name": "Black River",
    "countryCode": 140
  },
  {
    "stateCode": 2413,
    "name": "Eau Coulee",
    "countryCode": 140
  },
  {
    "stateCode": 2414,
    "name": "Flacq",
    "countryCode": 140
  },
  {
    "stateCode": 2415,
    "name": "Floreal",
    "countryCode": 140
  },
  {
    "stateCode": 2416,
    "name": "Grand Port",
    "countryCode": 140
  },
  {
    "stateCode": 2417,
    "name": "Moka",
    "countryCode": 140
  },
  {
    "stateCode": 2418,
    "name": "Pamplempousses",
    "countryCode": 140
  },
  {
    "stateCode": 2419,
    "name": "Plaines Wilhelm",
    "countryCode": 140
  },
  {
    "stateCode": 2420,
    "name": "Port Louis",
    "countryCode": 140
  },
  {
    "stateCode": 2421,
    "name": "Riviere du Rempart",
    "countryCode": 140
  },
  {
    "stateCode": 2422,
    "name": "Rodrigues",
    "countryCode": 140
  },
  {
    "stateCode": 2423,
    "name": "Rose Hill",
    "countryCode": 140
  },
  {
    "stateCode": 2424,
    "name": "Savanne",
    "countryCode": 140
  },
  {
    "stateCode": 2425,
    "name": "Mayotte",
    "countryCode": 141
  },
  {
    "stateCode": 2426,
    "name": "Pamanzi",
    "countryCode": 141
  },
  {
    "stateCode": 2427,
    "name": "Aguascalientes",
    "countryCode": 142
  },
  {
    "stateCode": 2428,
    "name": "Baja California",
    "countryCode": 142
  },
  {
    "stateCode": 2429,
    "name": "Baja California Sur",
    "countryCode": 142
  },
  {
    "stateCode": 2430,
    "name": "Campeche",
    "countryCode": 142
  },
  {
    "stateCode": 2431,
    "name": "Chiapas",
    "countryCode": 142
  },
  {
    "stateCode": 2432,
    "name": "Chihuahua",
    "countryCode": 142
  },
  {
    "stateCode": 2433,
    "name": "Coahuila",
    "countryCode": 142
  },
  {
    "stateCode": 2434,
    "name": "Colima",
    "countryCode": 142
  },
  {
    "stateCode": 2435,
    "name": "Distrito Federal",
    "countryCode": 142
  },
  {
    "stateCode": 2436,
    "name": "Durango",
    "countryCode": 142
  },
  {
    "stateCode": 2437,
    "name": "Estado de Mexico",
    "countryCode": 142
  },
  {
    "stateCode": 2438,
    "name": "Guanajuato",
    "countryCode": 142
  },
  {
    "stateCode": 2439,
    "name": "Guerrero",
    "countryCode": 142
  },
  {
    "stateCode": 2440,
    "name": "Hidalgo",
    "countryCode": 142
  },
  {
    "stateCode": 2441,
    "name": "Jalisco",
    "countryCode": 142
  },
  {
    "stateCode": 2442,
    "name": "Mexico",
    "countryCode": 142
  },
  {
    "stateCode": 2443,
    "name": "Michoacan",
    "countryCode": 142
  },
  {
    "stateCode": 2444,
    "name": "Morelos",
    "countryCode": 142
  },
  {
    "stateCode": 2445,
    "name": "Nayarit",
    "countryCode": 142
  },
  {
    "stateCode": 2446,
    "name": "Nuevo Leon",
    "countryCode": 142
  },
  {
    "stateCode": 2447,
    "name": "Oaxaca",
    "countryCode": 142
  },
  {
    "stateCode": 2448,
    "name": "Puebla",
    "countryCode": 142
  },
  {
    "stateCode": 2449,
    "name": "Queretaro",
    "countryCode": 142
  },
  {
    "stateCode": 2450,
    "name": "Quintana Roo",
    "countryCode": 142
  },
  {
    "stateCode": 2451,
    "name": "San Luis Potosi",
    "countryCode": 142
  },
  {
    "stateCode": 2452,
    "name": "Sinaloa",
    "countryCode": 142
  },
  {
    "stateCode": 2453,
    "name": "Sonora",
    "countryCode": 142
  },
  {
    "stateCode": 2454,
    "name": "Tabasco",
    "countryCode": 142
  },
  {
    "stateCode": 2455,
    "name": "Tamaulipas",
    "countryCode": 142
  },
  {
    "stateCode": 2456,
    "name": "Tlaxcala",
    "countryCode": 142
  },
  {
    "stateCode": 2457,
    "name": "Veracruz",
    "countryCode": 142
  },
  {
    "stateCode": 2458,
    "name": "Yucatan",
    "countryCode": 142
  },
  {
    "stateCode": 2459,
    "name": "Zacatecas",
    "countryCode": 142
  },
  {
    "stateCode": 2460,
    "name": "Chuuk",
    "countryCode": 143
  },
  {
    "stateCode": 2461,
    "name": "Kusaie",
    "countryCode": 143
  },
  {
    "stateCode": 2462,
    "name": "Pohnpei",
    "countryCode": 143
  },
  {
    "stateCode": 2463,
    "name": "Yap",
    "countryCode": 143
  },
  {
    "stateCode": 2464,
    "name": "Balti",
    "countryCode": 144
  },
  {
    "stateCode": 2465,
    "name": "Cahul",
    "countryCode": 144
  },
  {
    "stateCode": 2466,
    "name": "Chisinau",
    "countryCode": 144
  },
  {
    "stateCode": 2467,
    "name": "Chisinau Oras",
    "countryCode": 144
  },
  {
    "stateCode": 2468,
    "name": "Edinet",
    "countryCode": 144
  },
  {
    "stateCode": 2469,
    "name": "Gagauzia",
    "countryCode": 144
  },
  {
    "stateCode": 2470,
    "name": "Lapusna",
    "countryCode": 144
  },
  {
    "stateCode": 2471,
    "name": "Orhei",
    "countryCode": 144
  },
  {
    "stateCode": 2472,
    "name": "Soroca",
    "countryCode": 144
  },
  {
    "stateCode": 2473,
    "name": "Taraclia",
    "countryCode": 144
  },
  {
    "stateCode": 2474,
    "name": "Tighina",
    "countryCode": 144
  },
  {
    "stateCode": 2475,
    "name": "Transnistria",
    "countryCode": 144
  },
  {
    "stateCode": 2476,
    "name": "Ungheni",
    "countryCode": 144
  },
  {
    "stateCode": 2477,
    "name": "Fontvieille",
    "countryCode": 145
  },
  {
    "stateCode": 2478,
    "name": "La Condamine",
    "countryCode": 145
  },
  {
    "stateCode": 2479,
    "name": "Monaco-Ville",
    "countryCode": 145
  },
  {
    "stateCode": 2480,
    "name": "Monte Carlo",
    "countryCode": 145
  },
  {
    "stateCode": 2481,
    "name": "Arhangaj",
    "countryCode": 146
  },
  {
    "stateCode": 2482,
    "name": "Bajan-Olgij",
    "countryCode": 146
  },
  {
    "stateCode": 2483,
    "name": "Bajanhongor",
    "countryCode": 146
  },
  {
    "stateCode": 2484,
    "name": "Bulgan",
    "countryCode": 146
  },
  {
    "stateCode": 2485,
    "name": "Darhan-Uul",
    "countryCode": 146
  },
  {
    "stateCode": 2486,
    "name": "Dornod",
    "countryCode": 146
  },
  {
    "stateCode": 2487,
    "name": "Dornogovi",
    "countryCode": 146
  },
  {
    "stateCode": 2488,
    "name": "Dundgovi",
    "countryCode": 146
  },
  {
    "stateCode": 2489,
    "name": "Govi-Altaj",
    "countryCode": 146
  },
  {
    "stateCode": 2490,
    "name": "Govisumber",
    "countryCode": 146
  },
  {
    "stateCode": 2491,
    "name": "Hentij",
    "countryCode": 146
  },
  {
    "stateCode": 2492,
    "name": "Hovd",
    "countryCode": 146
  },
  {
    "stateCode": 2493,
    "name": "Hovsgol",
    "countryCode": 146
  },
  {
    "stateCode": 2494,
    "name": "Omnogovi",
    "countryCode": 146
  },
  {
    "stateCode": 2495,
    "name": "Orhon",
    "countryCode": 146
  },
  {
    "stateCode": 2496,
    "name": "Ovorhangaj",
    "countryCode": 146
  },
  {
    "stateCode": 2497,
    "name": "Selenge",
    "countryCode": 146
  },
  {
    "stateCode": 2498,
    "name": "Suhbaatar",
    "countryCode": 146
  },
  {
    "stateCode": 2499,
    "name": "Tov",
    "countryCode": 146
  },
  {
    "stateCode": 2500,
    "name": "Ulaanbaatar",
    "countryCode": 146
  },
  {
    "stateCode": 2501,
    "name": "Uvs",
    "countryCode": 146
  },
  {
    "stateCode": 2502,
    "name": "Zavhan",
    "countryCode": 146
  },
  {
    "stateCode": 2503,
    "name": "Montserrat",
    "countryCode": 147
  },
  {
    "stateCode": 2504,
    "name": "Agadir",
    "countryCode": 148
  },
  {
    "stateCode": 2505,
    "name": "Casablanca",
    "countryCode": 148
  },
  {
    "stateCode": 2506,
    "name": "Chaouia-Ouardigha",
    "countryCode": 148
  },
  {
    "stateCode": 2507,
    "name": "Doukkala-Abda",
    "countryCode": 148
  },
  {
    "stateCode": 2508,
    "name": "Fes-Boulemane",
    "countryCode": 148
  },
  {
    "stateCode": 2509,
    "name": "Gharb-Chrarda-Beni Hssen",
    "countryCode": 148
  },
  {
    "stateCode": 2510,
    "name": "Guelmim",
    "countryCode": 148
  },
  {
    "stateCode": 2511,
    "name": "Kenitra",
    "countryCode": 148
  },
  {
    "stateCode": 2512,
    "name": "Marrakech-Tensift-Al Haouz",
    "countryCode": 148
  },
  {
    "stateCode": 2513,
    "name": "Meknes-Tafilalet",
    "countryCode": 148
  },
  {
    "stateCode": 2514,
    "name": "Oriental",
    "countryCode": 148
  },
  {
    "stateCode": 2515,
    "name": "Oujda",
    "countryCode": 148
  },
  {
    "stateCode": 2516,
    "name": "Province de Tanger",
    "countryCode": 148
  },
  {
    "stateCode": 2517,
    "name": "Rabat-Sale-Zammour-Zaer",
    "countryCode": 148
  },
  {
    "stateCode": 2518,
    "name": "Sala Al Jadida",
    "countryCode": 148
  },
  {
    "stateCode": 2519,
    "name": "Settat",
    "countryCode": 148
  },
  {
    "stateCode": 2520,
    "name": "Souss Massa-Draa",
    "countryCode": 148
  },
  {
    "stateCode": 2521,
    "name": "Tadla-Azilal",
    "countryCode": 148
  },
  {
    "stateCode": 2522,
    "name": "Tangier-Tetouan",
    "countryCode": 148
  },
  {
    "stateCode": 2523,
    "name": "Taza-Al Hoceima-Taounate",
    "countryCode": 148
  },
  {
    "stateCode": 2524,
    "name": "Wilaya de Casablanca",
    "countryCode": 148
  },
  {
    "stateCode": 2525,
    "name": "Wilaya de Rabat-Sale",
    "countryCode": 148
  },
  {
    "stateCode": 2526,
    "name": "Cabo Delgado",
    "countryCode": 149
  },
  {
    "stateCode": 2527,
    "name": "Gaza",
    "countryCode": 149
  },
  {
    "stateCode": 2528,
    "name": "Inhambane",
    "countryCode": 149
  },
  {
    "stateCode": 2529,
    "name": "Manica",
    "countryCode": 149
  },
  {
    "stateCode": 2530,
    "name": "Maputo",
    "countryCode": 149
  },
  {
    "stateCode": 2531,
    "name": "Maputo Provincia",
    "countryCode": 149
  },
  {
    "stateCode": 2532,
    "name": "Nampula",
    "countryCode": 149
  },
  {
    "stateCode": 2533,
    "name": "Niassa",
    "countryCode": 149
  },
  {
    "stateCode": 2534,
    "name": "Sofala",
    "countryCode": 149
  },
  {
    "stateCode": 2535,
    "name": "Tete",
    "countryCode": 149
  },
  {
    "stateCode": 2536,
    "name": "Zambezia",
    "countryCode": 149
  },
  {
    "stateCode": 2537,
    "name": "Ayeyarwady",
    "countryCode": 150
  },
  {
    "stateCode": 2538,
    "name": "Bago",
    "countryCode": 150
  },
  {
    "stateCode": 2539,
    "name": "Chin",
    "countryCode": 150
  },
  {
    "stateCode": 2540,
    "name": "Kachin",
    "countryCode": 150
  },
  {
    "stateCode": 2541,
    "name": "Kayah",
    "countryCode": 150
  },
  {
    "stateCode": 2542,
    "name": "Kayin",
    "countryCode": 150
  },
  {
    "stateCode": 2543,
    "name": "Magway",
    "countryCode": 150
  },
  {
    "stateCode": 2544,
    "name": "Mandalay",
    "countryCode": 150
  },
  {
    "stateCode": 2545,
    "name": "Mon",
    "countryCode": 150
  },
  {
    "stateCode": 2546,
    "name": "Nay Pyi Taw",
    "countryCode": 150
  },
  {
    "stateCode": 2547,
    "name": "Rakhine",
    "countryCode": 150
  },
  {
    "stateCode": 2548,
    "name": "Sagaing",
    "countryCode": 150
  },
  {
    "stateCode": 2549,
    "name": "Shan",
    "countryCode": 150
  },
  {
    "stateCode": 2550,
    "name": "Tanintharyi",
    "countryCode": 150
  },
  {
    "stateCode": 2551,
    "name": "Yangon",
    "countryCode": 150
  },
  {
    "stateCode": 2552,
    "name": "Caprivi",
    "countryCode": 151
  },
  {
    "stateCode": 2553,
    "name": "Erongo",
    "countryCode": 151
  },
  {
    "stateCode": 2554,
    "name": "Hardap",
    "countryCode": 151
  },
  {
    "stateCode": 2555,
    "name": "Karas",
    "countryCode": 151
  },
  {
    "stateCode": 2556,
    "name": "Kavango",
    "countryCode": 151
  },
  {
    "stateCode": 2557,
    "name": "Khomas",
    "countryCode": 151
  },
  {
    "stateCode": 2558,
    "name": "Kunene",
    "countryCode": 151
  },
  {
    "stateCode": 2559,
    "name": "Ohangwena",
    "countryCode": 151
  },
  {
    "stateCode": 2560,
    "name": "Omaheke",
    "countryCode": 151
  },
  {
    "stateCode": 2561,
    "name": "Omusati",
    "countryCode": 151
  },
  {
    "stateCode": 2562,
    "name": "Oshana",
    "countryCode": 151
  },
  {
    "stateCode": 2563,
    "name": "Oshikoto",
    "countryCode": 151
  },
  {
    "stateCode": 2564,
    "name": "Otjozondjupa",
    "countryCode": 151
  },
  {
    "stateCode": 2565,
    "name": "Yaren",
    "countryCode": 152
  },
  {
    "stateCode": 2566,
    "name": "Bagmati",
    "countryCode": 153
  },
  {
    "stateCode": 2567,
    "name": "Bheri",
    "countryCode": 153
  },
  {
    "stateCode": 2568,
    "name": "Dhawalagiri",
    "countryCode": 153
  },
  {
    "stateCode": 2569,
    "name": "Gandaki",
    "countryCode": 153
  },
  {
    "stateCode": 2570,
    "name": "Janakpur",
    "countryCode": 153
  },
  {
    "stateCode": 2571,
    "name": "Karnali",
    "countryCode": 153
  },
  {
    "stateCode": 2572,
    "name": "Koshi",
    "countryCode": 153
  },
  {
    "stateCode": 2573,
    "name": "Lumbini",
    "countryCode": 153
  },
  {
    "stateCode": 2574,
    "name": "Mahakali",
    "countryCode": 153
  },
  {
    "stateCode": 2575,
    "name": "Mechi",
    "countryCode": 153
  },
  {
    "stateCode": 2576,
    "name": "Narayani",
    "countryCode": 153
  },
  {
    "stateCode": 2577,
    "name": "Rapti",
    "countryCode": 153
  },
  {
    "stateCode": 2578,
    "name": "Sagarmatha",
    "countryCode": 153
  },
  {
    "stateCode": 2579,
    "name": "Seti",
    "countryCode": 153
  },
  {
    "stateCode": 2580,
    "name": "Bonaire",
    "countryCode": 154
  },
  {
    "stateCode": 2581,
    "name": "Curacao",
    "countryCode": 154
  },
  {
    "stateCode": 2582,
    "name": "Saba",
    "countryCode": 154
  },
  {
    "stateCode": 2583,
    "name": "Sint Eustatius",
    "countryCode": 154
  },
  {
    "stateCode": 2584,
    "name": "Sint Maarten",
    "countryCode": 154
  },
  {
    "stateCode": 2585,
    "name": "Amsterdam",
    "countryCode": 155
  },
  {
    "stateCode": 2586,
    "name": "Benelux",
    "countryCode": 155
  },
  {
    "stateCode": 2587,
    "name": "Drenthe",
    "countryCode": 155
  },
  {
    "stateCode": 2588,
    "name": "Flevoland",
    "countryCode": 155
  },
  {
    "stateCode": 2589,
    "name": "Friesland",
    "countryCode": 155
  },
  {
    "stateCode": 2590,
    "name": "Gelderland",
    "countryCode": 155
  },
  {
    "stateCode": 2591,
    "name": "Groningen",
    "countryCode": 155
  },
  {
    "stateCode": 2592,
    "name": "Limburg",
    "countryCode": 155
  },
  {
    "stateCode": 2593,
    "name": "Noord-Brabant",
    "countryCode": 155
  },
  {
    "stateCode": 2594,
    "name": "Noord-Holland",
    "countryCode": 155
  },
  {
    "stateCode": 2595,
    "name": "Overijssel",
    "countryCode": 155
  },
  {
    "stateCode": 2596,
    "name": "South Holland",
    "countryCode": 155
  },
  {
    "stateCode": 2597,
    "name": "Utrecht",
    "countryCode": 155
  },
  {
    "stateCode": 2598,
    "name": "Zeeland",
    "countryCode": 155
  },
  {
    "stateCode": 2599,
    "name": "Zuid-Holland",
    "countryCode": 155
  },
  {
    "stateCode": 2600,
    "name": "Iles",
    "countryCode": 156
  },
  {
    "stateCode": 2601,
    "name": "Nord",
    "countryCode": 156
  },
  {
    "stateCode": 2602,
    "name": "Sud",
    "countryCode": 156
  },
  {
    "stateCode": 2603,
    "name": "Area Outside Region",
    "countryCode": 157
  },
  {
    "stateCode": 2604,
    "name": "Auckland",
    "countryCode": 157
  },
  {
    "stateCode": 2605,
    "name": "Bay of Plenty",
    "countryCode": 157
  },
  {
    "stateCode": 2606,
    "name": "Canterbury",
    "countryCode": 157
  },
  {
    "stateCode": 2607,
    "name": "Christchurch",
    "countryCode": 157
  },
  {
    "stateCode": 2608,
    "name": "Gisborne",
    "countryCode": 157
  },
  {
    "stateCode": 2609,
    "name": "Hawke\\s Bay, 157"
  },
  {
    "stateCode": 2610,
    "name": "Manawatu-Wanganui",
    "countryCode": 157
  },
  {
    "stateCode": 2611,
    "name": "Marlborough",
    "countryCode": 157
  },
  {
    "stateCode": 2612,
    "name": "Nelson",
    "countryCode": 157
  },
  {
    "stateCode": 2613,
    "name": "Northland",
    "countryCode": 157
  },
  {
    "stateCode": 2614,
    "name": "Otago",
    "countryCode": 157
  },
  {
    "stateCode": 2615,
    "name": "Rodney",
    "countryCode": 157
  },
  {
    "stateCode": 2616,
    "name": "Southland",
    "countryCode": 157
  },
  {
    "stateCode": 2617,
    "name": "Taranaki",
    "countryCode": 157
  },
  {
    "stateCode": 2618,
    "name": "Tasman",
    "countryCode": 157
  },
  {
    "stateCode": 2619,
    "name": "Waikato",
    "countryCode": 157
  },
  {
    "stateCode": 2620,
    "name": "Wellington",
    "countryCode": 157
  },
  {
    "stateCode": 2621,
    "name": "West Coast",
    "countryCode": 157
  },
  {
    "stateCode": 2622,
    "name": "Atlantico Norte",
    "countryCode": 158
  },
  {
    "stateCode": 2623,
    "name": "Atlantico Sur",
    "countryCode": 158
  },
  {
    "stateCode": 2624,
    "name": "Boaco",
    "countryCode": 158
  },
  {
    "stateCode": 2625,
    "name": "Carazo",
    "countryCode": 158
  },
  {
    "stateCode": 2626,
    "name": "Chinandega",
    "countryCode": 158
  },
  {
    "stateCode": 2627,
    "name": "Chontales",
    "countryCode": 158
  },
  {
    "stateCode": 2628,
    "name": "Esteli",
    "countryCode": 158
  },
  {
    "stateCode": 2629,
    "name": "Granada",
    "countryCode": 158
  },
  {
    "stateCode": 2630,
    "name": "Jinotega",
    "countryCode": 158
  },
  {
    "stateCode": 2631,
    "name": "Leon",
    "countryCode": 158
  },
  {
    "stateCode": 2632,
    "name": "Madriz",
    "countryCode": 158
  },
  {
    "stateCode": 2633,
    "name": "Managua",
    "countryCode": 158
  },
  {
    "stateCode": 2634,
    "name": "Masaya",
    "countryCode": 158
  },
  {
    "stateCode": 2635,
    "name": "Matagalpa",
    "countryCode": 158
  },
  {
    "stateCode": 2636,
    "name": "Nueva Segovia",
    "countryCode": 158
  },
  {
    "stateCode": 2637,
    "name": "Rio San Juan",
    "countryCode": 158
  },
  {
    "stateCode": 2638,
    "name": "Rivas",
    "countryCode": 158
  },
  {
    "stateCode": 2639,
    "name": "Agadez",
    "countryCode": 159
  },
  {
    "stateCode": 2640,
    "name": "Diffa",
    "countryCode": 159
  },
  {
    "stateCode": 2641,
    "name": "Dosso",
    "countryCode": 159
  },
  {
    "stateCode": 2642,
    "name": "Maradi",
    "countryCode": 159
  },
  {
    "stateCode": 2643,
    "name": "Niamey",
    "countryCode": 159
  },
  {
    "stateCode": 2644,
    "name": "Tahoua",
    "countryCode": 159
  },
  {
    "stateCode": 2645,
    "name": "Tillabery",
    "countryCode": 159
  },
  {
    "stateCode": 2646,
    "name": "Zinder",
    "countryCode": 159
  },
  {
    "stateCode": 2647,
    "name": "Abia",
    "countryCode": 160
  },
  {
    "stateCode": 2648,
    "name": "Abuja Federal Capital Territor",
    "countryCode": 160
  },
  {
    "stateCode": 2649,
    "name": "Adamawa",
    "countryCode": 160
  },
  {
    "stateCode": 2650,
    "name": "Akwa Ibom",
    "countryCode": 160
  },
  {
    "stateCode": 2651,
    "name": "Anambra",
    "countryCode": 160
  },
  {
    "stateCode": 2652,
    "name": "Bauchi",
    "countryCode": 160
  },
  {
    "stateCode": 2653,
    "name": "Bayelsa",
    "countryCode": 160
  },
  {
    "stateCode": 2654,
    "name": "Benue",
    "countryCode": 160
  },
  {
    "stateCode": 2655,
    "name": "Borno",
    "countryCode": 160
  },
  {
    "stateCode": 2656,
    "name": "Cross River",
    "countryCode": 160
  },
  {
    "stateCode": 2657,
    "name": "Delta",
    "countryCode": 160
  },
  {
    "stateCode": 2658,
    "name": "Ebonyi",
    "countryCode": 160
  },
  {
    "stateCode": 2659,
    "name": "Edo",
    "countryCode": 160
  },
  {
    "stateCode": 2660,
    "name": "Ekiti",
    "countryCode": 160
  },
  {
    "stateCode": 2661,
    "name": "Enugu",
    "countryCode": 160
  },
  {
    "stateCode": 2662,
    "name": "Gombe",
    "countryCode": 160
  },
  {
    "stateCode": 2663,
    "name": "Imo",
    "countryCode": 160
  },
  {
    "stateCode": 2664,
    "name": "Jigawa",
    "countryCode": 160
  },
  {
    "stateCode": 2665,
    "name": "Kaduna",
    "countryCode": 160
  },
  {
    "stateCode": 2666,
    "name": "Kano",
    "countryCode": 160
  },
  {
    "stateCode": 2667,
    "name": "Katsina",
    "countryCode": 160
  },
  {
    "stateCode": 2668,
    "name": "Kebbi",
    "countryCode": 160
  },
  {
    "stateCode": 2669,
    "name": "Kogi",
    "countryCode": 160
  },
  {
    "stateCode": 2670,
    "name": "Kwara",
    "countryCode": 160
  },
  {
    "stateCode": 2671,
    "name": "Lagos",
    "countryCode": 160
  },
  {
    "stateCode": 2672,
    "name": "Nassarawa",
    "countryCode": 160
  },
  {
    "stateCode": 2673,
    "name": "Niger",
    "countryCode": 160
  },
  {
    "stateCode": 2674,
    "name": "Ogun",
    "countryCode": 160
  },
  {
    "stateCode": 2675,
    "name": "Ondo",
    "countryCode": 160
  },
  {
    "stateCode": 2676,
    "name": "Osun",
    "countryCode": 160
  },
  {
    "stateCode": 2677,
    "name": "Oyo",
    "countryCode": 160
  },
  {
    "stateCode": 2678,
    "name": "Plateau",
    "countryCode": 160
  },
  {
    "stateCode": 2679,
    "name": "Rivers",
    "countryCode": 160
  },
  {
    "stateCode": 2680,
    "name": "Sokoto",
    "countryCode": 160
  },
  {
    "stateCode": 2681,
    "name": "Taraba",
    "countryCode": 160
  },
  {
    "stateCode": 2682,
    "name": "Yobe",
    "countryCode": 160
  },
  {
    "stateCode": 2683,
    "name": "Zamfara",
    "countryCode": 160
  },
  {
    "stateCode": 2684,
    "name": "Niue",
    "countryCode": 161
  },
  {
    "stateCode": 2685,
    "name": "Norfolk Island",
    "countryCode": 162
  },
  {
    "stateCode": 2686,
    "name": "Northern Islands",
    "countryCode": 163
  },
  {
    "stateCode": 2687,
    "name": "Rota",
    "countryCode": 163
  },
  {
    "stateCode": 2688,
    "name": "Saipan",
    "countryCode": 163
  },
  {
    "stateCode": 2689,
    "name": "Tinian",
    "countryCode": 163
  },
  {
    "stateCode": 2690,
    "name": "Akershus",
    "countryCode": 164
  },
  {
    "stateCode": 2691,
    "name": "Aust Agder",
    "countryCode": 164
  },
  {
    "stateCode": 2692,
    "name": "Bergen",
    "countryCode": 164
  },
  {
    "stateCode": 2693,
    "name": "Buskerud",
    "countryCode": 164
  },
  {
    "stateCode": 2694,
    "name": "Finnmark",
    "countryCode": 164
  },
  {
    "stateCode": 2695,
    "name": "Hedmark",
    "countryCode": 164
  },
  {
    "stateCode": 2696,
    "name": "Hordaland",
    "countryCode": 164
  },
  {
    "stateCode": 2697,
    "name": "Moere og Romsdal",
    "countryCode": 164
  },
  {
    "stateCode": 2698,
    "name": "Nord Trondelag",
    "countryCode": 164
  },
  {
    "stateCode": 2699,
    "name": "Nordland",
    "countryCode": 164
  },
  {
    "stateCode": 2700,
    "name": "Oestfold",
    "countryCode": 164
  },
  {
    "stateCode": 2701,
    "name": "Oppland",
    "countryCode": 164
  },
  {
    "stateCode": 2702,
    "name": "Oslo",
    "countryCode": 164
  },
  {
    "stateCode": 2703,
    "name": "Rogaland",
    "countryCode": 164
  },
  {
    "stateCode": 2704,
    "name": "Soer Troendelag",
    "countryCode": 164
  },
  {
    "stateCode": 2705,
    "name": "Sogn og Fjordane",
    "countryCode": 164
  },
  {
    "stateCode": 2706,
    "name": "Stavern",
    "countryCode": 164
  },
  {
    "stateCode": 2707,
    "name": "Sykkylven",
    "countryCode": 164
  },
  {
    "stateCode": 2708,
    "name": "Telemark",
    "countryCode": 164
  },
  {
    "stateCode": 2709,
    "name": "Troms",
    "countryCode": 164
  },
  {
    "stateCode": 2710,
    "name": "Vest Agder",
    "countryCode": 164
  },
  {
    "stateCode": 2711,
    "name": "Vestfold",
    "countryCode": 164
  },
  {
    "stateCode": 2712,
    "name": "ÃƒÂ˜stfold",
    "countryCode": 164
  },
  {
    "stateCode": 2713,
    "name": "Al Buraimi",
    "countryCode": 165
  },
  {
    "stateCode": 2714,
    "name": "Dhufar",
    "countryCode": 165
  },
  {
    "stateCode": 2715,
    "name": "Masqat",
    "countryCode": 165
  },
  {
    "stateCode": 2716,
    "name": "Musandam",
    "countryCode": 165
  },
  {
    "stateCode": 2717,
    "name": "Rusayl",
    "countryCode": 165
  },
  {
    "stateCode": 2718,
    "name": "Wadi Kabir",
    "countryCode": 165
  },
  {
    "stateCode": 2719,
    "name": "ad-Dakhiliyah",
    "countryCode": 165
  },
  {
    "stateCode": 2720,
    "name": "adh-Dhahirah",
    "countryCode": 165
  },
  {
    "stateCode": 2721,
    "name": "al-Batinah",
    "countryCode": 165
  },
  {
    "stateCode": 2722,
    "name": "ash-Sharqiyah",
    "countryCode": 165
  },
  {
    "stateCode": 2723,
    "name": "Baluchistan",
    "countryCode": 166
  },
  {
    "stateCode": 2724,
    "name": "Federal Capital Area",
    "countryCode": 166
  },
  {
    "stateCode": 2725,
    "name": "Federally administered Tribal",
    "countryCode": 166
  },
  {
    "stateCode": 2726,
    "name": "North-West Frontier",
    "countryCode": 166
  },
  {
    "stateCode": 2727,
    "name": "Northern Areas",
    "countryCode": 166
  },
  {
    "stateCode": 2728,
    "name": "Punjab",
    "countryCode": 166
  },
  {
    "stateCode": 2729,
    "name": "Sind",
    "countryCode": 166
  },
  {
    "stateCode": 2730,
    "name": "Aimeliik",
    "countryCode": 167
  },
  {
    "stateCode": 2731,
    "name": "Airai",
    "countryCode": 167
  },
  {
    "stateCode": 2732,
    "name": "Angaur",
    "countryCode": 167
  },
  {
    "stateCode": 2733,
    "name": "Hatobohei",
    "countryCode": 167
  },
  {
    "stateCode": 2734,
    "name": "Kayangel",
    "countryCode": 167
  },
  {
    "stateCode": 2735,
    "name": "Koror",
    "countryCode": 167
  },
  {
    "stateCode": 2736,
    "name": "Melekeok",
    "countryCode": 167
  },
  {
    "stateCode": 2737,
    "name": "Ngaraard",
    "countryCode": 167
  },
  {
    "stateCode": 2738,
    "name": "Ngardmau",
    "countryCode": 167
  },
  {
    "stateCode": 2739,
    "name": "Ngaremlengui",
    "countryCode": 167
  },
  {
    "stateCode": 2740,
    "name": "Ngatpang",
    "countryCode": 167
  },
  {
    "stateCode": 2741,
    "name": "Ngchesar",
    "countryCode": 167
  },
  {
    "stateCode": 2742,
    "name": "Ngerchelong",
    "countryCode": 167
  },
  {
    "stateCode": 2743,
    "name": "Ngiwal",
    "countryCode": 167
  },
  {
    "stateCode": 2744,
    "name": "Peleliu",
    "countryCode": 167
  },
  {
    "stateCode": 2745,
    "name": "Sonsorol",
    "countryCode": 167
  },
  {
    "stateCode": 2746,
    "name": "Ariha",
    "countryCode": 168
  },
  {
    "stateCode": 2747,
    "name": "Bayt Lahm",
    "countryCode": 168
  },
  {
    "stateCode": 2748,
    "name": "Bethlehem",
    "countryCode": 168
  },
  {
    "stateCode": 2749,
    "name": "Dayr-al-Balah",
    "countryCode": 168
  },
  {
    "stateCode": 2750,
    "name": "Ghazzah",
    "countryCode": 168
  },
  {
    "stateCode": 2751,
    "name": "Ghazzah ash-Shamaliyah",
    "countryCode": 168
  },
  {
    "stateCode": 2752,
    "name": "Janin",
    "countryCode": 168
  },
  {
    "stateCode": 2753,
    "name": "Khan Yunis",
    "countryCode": 168
  },
  {
    "stateCode": 2754,
    "name": "Nabulus",
    "countryCode": 168
  },
  {
    "stateCode": 2755,
    "name": "Qalqilyah",
    "countryCode": 168
  },
  {
    "stateCode": 2756,
    "name": "Rafah",
    "countryCode": 168
  },
  {
    "stateCode": 2757,
    "name": "Ram Allah wal-Birah",
    "countryCode": 168
  },
  {
    "stateCode": 2758,
    "name": "Salfit",
    "countryCode": 168
  },
  {
    "stateCode": 2759,
    "name": "Tubas",
    "countryCode": 168
  },
  {
    "stateCode": 2760,
    "name": "Tulkarm",
    "countryCode": 168
  },
  {
    "stateCode": 2761,
    "name": "al-Khalil",
    "countryCode": 168
  },
  {
    "stateCode": 2762,
    "name": "al-Quds",
    "countryCode": 168
  },
  {
    "stateCode": 2763,
    "name": "Bocas del Toro",
    "countryCode": 169
  },
  {
    "stateCode": 2764,
    "name": "Chiriqui",
    "countryCode": 169
  },
  {
    "stateCode": 2765,
    "name": "Cocle",
    "countryCode": 169
  },
  {
    "stateCode": 2766,
    "name": "Colon",
    "countryCode": 169
  },
  {
    "stateCode": 2767,
    "name": "Darien",
    "countryCode": 169
  },
  {
    "stateCode": 2768,
    "name": "Embera",
    "countryCode": 169
  },
  {
    "stateCode": 2769,
    "name": "Herrera",
    "countryCode": 169
  },
  {
    "stateCode": 2770,
    "name": "Kuna Yala",
    "countryCode": 169
  },
  {
    "stateCode": 2771,
    "name": "Los Santos",
    "countryCode": 169
  },
  {
    "stateCode": 2772,
    "name": "Ngobe Bugle",
    "countryCode": 169
  },
  {
    "stateCode": 2773,
    "name": "Panama",
    "countryCode": 169
  },
  {
    "stateCode": 2774,
    "name": "Veraguas",
    "countryCode": 169
  },
  {
    "stateCode": 2775,
    "name": "East New Britain",
    "countryCode": 170
  },
  {
    "stateCode": 2776,
    "name": "East Sepik",
    "countryCode": 170
  },
  {
    "stateCode": 2777,
    "name": "Eastern Highlands",
    "countryCode": 170
  },
  {
    "stateCode": 2778,
    "name": "Enga",
    "countryCode": 170
  },
  {
    "stateCode": 2779,
    "name": "Fly River",
    "countryCode": 170
  },
  {
    "stateCode": 2780,
    "name": "Gulf",
    "countryCode": 170
  },
  {
    "stateCode": 2781,
    "name": "Madang",
    "countryCode": 170
  },
  {
    "stateCode": 2782,
    "name": "Manus",
    "countryCode": 170
  },
  {
    "stateCode": 2783,
    "name": "Milne Bay",
    "countryCode": 170
  },
  {
    "stateCode": 2784,
    "name": "Morobe",
    "countryCode": 170
  },
  {
    "stateCode": 2785,
    "name": "National Capital District",
    "countryCode": 170
  },
  {
    "stateCode": 2786,
    "name": "New Ireland",
    "countryCode": 170
  },
  {
    "stateCode": 2787,
    "name": "North Solomons",
    "countryCode": 170
  },
  {
    "stateCode": 2788,
    "name": "Oro",
    "countryCode": 170
  },
  {
    "stateCode": 2789,
    "name": "Sandaun",
    "countryCode": 170
  },
  {
    "stateCode": 2790,
    "name": "Simbu",
    "countryCode": 170
  },
  {
    "stateCode": 2791,
    "name": "Southern Highlands",
    "countryCode": 170
  },
  {
    "stateCode": 2792,
    "name": "West New Britain",
    "countryCode": 170
  },
  {
    "stateCode": 2793,
    "name": "Western Highlands",
    "countryCode": 170
  },
  {
    "stateCode": 2794,
    "name": "Alto Paraguay",
    "countryCode": 171
  },
  {
    "stateCode": 2795,
    "name": "Alto Parana",
    "countryCode": 171
  },
  {
    "stateCode": 2796,
    "name": "Amambay",
    "countryCode": 171
  },
  {
    "stateCode": 2797,
    "name": "Asuncion",
    "countryCode": 171
  },
  {
    "stateCode": 2798,
    "name": "Boqueron",
    "countryCode": 171
  },
  {
    "stateCode": 2799,
    "name": "Caaguazu",
    "countryCode": 171
  },
  {
    "stateCode": 2800,
    "name": "Caazapa",
    "countryCode": 171
  },
  {
    "stateCode": 2801,
    "name": "Canendiyu",
    "countryCode": 171
  },
  {
    "stateCode": 2802,
    "name": "Central",
    "countryCode": 171
  },
  {
    "stateCode": 2803,
    "name": "Concepcion",
    "countryCode": 171
  },
  {
    "stateCode": 2804,
    "name": "Cordillera",
    "countryCode": 171
  },
  {
    "stateCode": 2805,
    "name": "Guaira",
    "countryCode": 171
  },
  {
    "stateCode": 2806,
    "name": "Itapua",
    "countryCode": 171
  },
  {
    "stateCode": 2807,
    "name": "Misiones",
    "countryCode": 171
  },
  {
    "stateCode": 2808,
    "name": "Neembucu",
    "countryCode": 171
  },
  {
    "stateCode": 2809,
    "name": "Paraguari",
    "countryCode": 171
  },
  {
    "stateCode": 2810,
    "name": "Presidente Hayes",
    "countryCode": 171
  },
  {
    "stateCode": 2811,
    "name": "San Pedro",
    "countryCode": 171
  },
  {
    "stateCode": 2812,
    "name": "Amazonas",
    "countryCode": 172
  },
  {
    "stateCode": 2813,
    "name": "Ancash",
    "countryCode": 172
  },
  {
    "stateCode": 2814,
    "name": "Apurimac",
    "countryCode": 172
  },
  {
    "stateCode": 2815,
    "name": "Arequipa",
    "countryCode": 172
  },
  {
    "stateCode": 2816,
    "name": "Ayacucho",
    "countryCode": 172
  },
  {
    "stateCode": 2817,
    "name": "Cajamarca",
    "countryCode": 172
  },
  {
    "stateCode": 2818,
    "name": "Cusco",
    "countryCode": 172
  },
  {
    "stateCode": 2819,
    "name": "Huancavelica",
    "countryCode": 172
  },
  {
    "stateCode": 2820,
    "name": "Huanuco",
    "countryCode": 172
  },
  {
    "stateCode": 2821,
    "name": "Ica",
    "countryCode": 172
  },
  {
    "stateCode": 2822,
    "name": "Junin",
    "countryCode": 172
  },
  {
    "stateCode": 2823,
    "name": "La Libertad",
    "countryCode": 172
  },
  {
    "stateCode": 2824,
    "name": "Lambayeque",
    "countryCode": 172
  },
  {
    "stateCode": 2825,
    "name": "Lima y Callao",
    "countryCode": 172
  },
  {
    "stateCode": 2826,
    "name": "Loreto",
    "countryCode": 172
  },
  {
    "stateCode": 2827,
    "name": "Madre de Dios",
    "countryCode": 172
  },
  {
    "stateCode": 2828,
    "name": "Moquegua",
    "countryCode": 172
  },
  {
    "stateCode": 2829,
    "name": "Pasco",
    "countryCode": 172
  },
  {
    "stateCode": 2830,
    "name": "Piura",
    "countryCode": 172
  },
  {
    "stateCode": 2831,
    "name": "Puno",
    "countryCode": 172
  },
  {
    "stateCode": 2832,
    "name": "San Martin",
    "countryCode": 172
  },
  {
    "stateCode": 2833,
    "name": "Tacna",
    "countryCode": 172
  },
  {
    "stateCode": 2834,
    "name": "Tumbes",
    "countryCode": 172
  },
  {
    "stateCode": 2835,
    "name": "Ucayali",
    "countryCode": 172
  },
  {
    "stateCode": 2836,
    "name": "Batangas",
    "countryCode": 173
  },
  {
    "stateCode": 2837,
    "name": "Bicol",
    "countryCode": 173
  },
  {
    "stateCode": 2838,
    "name": "Bulacan",
    "countryCode": 173
  },
  {
    "stateCode": 2839,
    "name": "Cagayan",
    "countryCode": 173
  },
  {
    "stateCode": 2840,
    "name": "Caraga",
    "countryCode": 173
  },
  {
    "stateCode": 2841,
    "name": "Central Luzon",
    "countryCode": 173
  },
  {
    "stateCode": 2842,
    "name": "Central Mindanao",
    "countryCode": 173
  },
  {
    "stateCode": 2843,
    "name": "Central Visayas",
    "countryCode": 173
  },
  {
    "stateCode": 2844,
    "name": "Cordillera",
    "countryCode": 173
  },
  {
    "stateCode": 2845,
    "name": "Davao",
    "countryCode": 173
  },
  {
    "stateCode": 2846,
    "name": "Eastern Visayas",
    "countryCode": 173
  },
  {
    "stateCode": 2847,
    "name": "Greater Metropolitan Area",
    "countryCode": 173
  },
  {
    "stateCode": 2848,
    "name": "Ilocos",
    "countryCode": 173
  },
  {
    "stateCode": 2849,
    "name": "Laguna",
    "countryCode": 173
  },
  {
    "stateCode": 2850,
    "name": "Luzon",
    "countryCode": 173
  },
  {
    "stateCode": 2851,
    "name": "Mactan",
    "countryCode": 173
  },
  {
    "stateCode": 2852,
    "name": "Metropolitan Manila Area",
    "countryCode": 173
  },
  {
    "stateCode": 2853,
    "name": "Muslim Mindanao",
    "countryCode": 173
  },
  {
    "stateCode": 2854,
    "name": "Northern Mindanao",
    "countryCode": 173
  },
  {
    "stateCode": 2855,
    "name": "Southern Mindanao",
    "countryCode": 173
  },
  {
    "stateCode": 2856,
    "name": "Southern Tagalog",
    "countryCode": 173
  },
  {
    "stateCode": 2857,
    "name": "Western Mindanao",
    "countryCode": 173
  },
  {
    "stateCode": 2858,
    "name": "Western Visayas",
    "countryCode": 173
  },
  {
    "stateCode": 2859,
    "name": "Pitcairn Island",
    "countryCode": 174
  },
  {
    "stateCode": 2860,
    "name": "Biale Blota",
    "countryCode": 175
  },
  {
    "stateCode": 2861,
    "name": "Dobroszyce",
    "countryCode": 175
  },
  {
    "stateCode": 2862,
    "name": "Dolnoslaskie",
    "countryCode": 175
  },
  {
    "stateCode": 2863,
    "name": "Dziekanow Lesny",
    "countryCode": 175
  },
  {
    "stateCode": 2864,
    "name": "Hopowo",
    "countryCode": 175
  },
  {
    "stateCode": 2865,
    "name": "Kartuzy",
    "countryCode": 175
  },
  {
    "stateCode": 2866,
    "name": "Koscian",
    "countryCode": 175
  },
  {
    "stateCode": 2867,
    "name": "Krakow",
    "countryCode": 175
  },
  {
    "stateCode": 2868,
    "name": "Kujawsko-Pomorskie",
    "countryCode": 175
  },
  {
    "stateCode": 2869,
    "name": "Lodzkie",
    "countryCode": 175
  },
  {
    "stateCode": 2870,
    "name": "Lubelskie",
    "countryCode": 175
  },
  {
    "stateCode": 2871,
    "name": "Lubuskie",
    "countryCode": 175
  },
  {
    "stateCode": 2872,
    "name": "Malomice",
    "countryCode": 175
  },
  {
    "stateCode": 2873,
    "name": "Malopolskie",
    "countryCode": 175
  },
  {
    "stateCode": 2874,
    "name": "Mazowieckie",
    "countryCode": 175
  },
  {
    "stateCode": 2875,
    "name": "Mirkow",
    "countryCode": 175
  },
  {
    "stateCode": 2876,
    "name": "Opolskie",
    "countryCode": 175
  },
  {
    "stateCode": 2877,
    "name": "Ostrowiec",
    "countryCode": 175
  },
  {
    "stateCode": 2878,
    "name": "Podkarpackie",
    "countryCode": 175
  },
  {
    "stateCode": 2879,
    "name": "Podlaskie",
    "countryCode": 175
  },
  {
    "stateCode": 2880,
    "name": "Polska",
    "countryCode": 175
  },
  {
    "stateCode": 2881,
    "name": "Pomorskie",
    "countryCode": 175
  },
  {
    "stateCode": 2882,
    "name": "Poznan",
    "countryCode": 175
  },
  {
    "stateCode": 2883,
    "name": "Pruszkow",
    "countryCode": 175
  },
  {
    "stateCode": 2884,
    "name": "Rymanowska",
    "countryCode": 175
  },
  {
    "stateCode": 2885,
    "name": "Rzeszow",
    "countryCode": 175
  },
  {
    "stateCode": 2886,
    "name": "Slaskie",
    "countryCode": 175
  },
  {
    "stateCode": 2887,
    "name": "Stare Pole",
    "countryCode": 175
  },
  {
    "stateCode": 2888,
    "name": "Swietokrzyskie",
    "countryCode": 175
  },
  {
    "stateCode": 2889,
    "name": "Warminsko-Mazurskie",
    "countryCode": 175
  },
  {
    "stateCode": 2890,
    "name": "Warsaw",
    "countryCode": 175
  },
  {
    "stateCode": 2891,
    "name": "Wejherowo",
    "countryCode": 175
  },
  {
    "stateCode": 2892,
    "name": "Wielkopolskie",
    "countryCode": 175
  },
  {
    "stateCode": 2893,
    "name": "Wroclaw",
    "countryCode": 175
  },
  {
    "stateCode": 2894,
    "name": "Zachodnio-Pomorskie",
    "countryCode": 175
  },
  {
    "stateCode": 2895,
    "name": "Zukowo",
    "countryCode": 175
  },
  {
    "stateCode": 2896,
    "name": "Abrantes",
    "countryCode": 176
  },
  {
    "stateCode": 2897,
    "name": "Acores",
    "countryCode": 176
  },
  {
    "stateCode": 2898,
    "name": "Alentejo",
    "countryCode": 176
  },
  {
    "stateCode": 2899,
    "name": "Algarve",
    "countryCode": 176
  },
  {
    "stateCode": 2900,
    "name": "Braga",
    "countryCode": 176
  },
  {
    "stateCode": 2901,
    "name": "Centro",
    "countryCode": 176
  },
  {
    "stateCode": 2902,
    "name": "Distrito de Leiria",
    "countryCode": 176
  },
  {
    "stateCode": 2903,
    "name": "Distrito de Viana do Castelo",
    "countryCode": 176
  },
  {
    "stateCode": 2904,
    "name": "Distrito de Vila Real",
    "countryCode": 176
  },
  {
    "stateCode": 2905,
    "name": "Distrito do Porto",
    "countryCode": 176
  },
  {
    "stateCode": 2906,
    "name": "Lisboa e Vale do Tejo",
    "countryCode": 176
  },
  {
    "stateCode": 2907,
    "name": "Madeira",
    "countryCode": 176
  },
  {
    "stateCode": 2908,
    "name": "Norte",
    "countryCode": 176
  },
  {
    "stateCode": 2909,
    "name": "Paivas",
    "countryCode": 176
  },
  {
    "stateCode": 2910,
    "name": "Arecibo",
    "countryCode": 177
  },
  {
    "stateCode": 2911,
    "name": "Bayamon",
    "countryCode": 177
  },
  {
    "stateCode": 2912,
    "name": "Carolina",
    "countryCode": 177
  },
  {
    "stateCode": 2913,
    "name": "Florida",
    "countryCode": 177
  },
  {
    "stateCode": 2914,
    "name": "Guayama",
    "countryCode": 177
  },
  {
    "stateCode": 2915,
    "name": "Humacao",
    "countryCode": 177
  },
  {
    "stateCode": 2916,
    "name": "Mayaguez-Aguadilla",
    "countryCode": 177
  },
  {
    "stateCode": 2917,
    "name": "Ponce",
    "countryCode": 177
  },
  {
    "stateCode": 2918,
    "name": "Salinas",
    "countryCode": 177
  },
  {
    "stateCode": 2919,
    "name": "San Juan",
    "countryCode": 177
  },
  {
    "stateCode": 2920,
    "name": "Doha",
    "countryCode": 178
  },
  {
    "stateCode": 2921,
    "name": "Jarian-al-Batnah",
    "countryCode": 178
  },
  {
    "stateCode": 2922,
    "name": "Umm Salal",
    "countryCode": 178
  },
  {
    "stateCode": 2923,
    "name": "ad-Dawhah",
    "countryCode": 178
  },
  {
    "stateCode": 2924,
    "name": "al-Ghuwayriyah",
    "countryCode": 178
  },
  {
    "stateCode": 2925,
    "name": "al-Jumayliyah",
    "countryCode": 178
  },
  {
    "stateCode": 2926,
    "name": "al-Khawr",
    "countryCode": 178
  },
  {
    "stateCode": 2927,
    "name": "al-Wakrah",
    "countryCode": 178
  },
  {
    "stateCode": 2928,
    "name": "ar-Rayyan",
    "countryCode": 178
  },
  {
    "stateCode": 2929,
    "name": "ash-Shamal",
    "countryCode": 178
  },
  {
    "stateCode": 2930,
    "name": "Saint-Benoit",
    "countryCode": 179
  },
  {
    "stateCode": 2931,
    "name": "Saint-Denis",
    "countryCode": 179
  },
  {
    "stateCode": 2932,
    "name": "Saint-Paul",
    "countryCode": 179
  },
  {
    "stateCode": 2933,
    "name": "Saint-Pierre",
    "countryCode": 179
  },
  {
    "stateCode": 2934,
    "name": "Alba",
    "countryCode": 180
  },
  {
    "stateCode": 2935,
    "name": "Arad",
    "countryCode": 180
  },
  {
    "stateCode": 2936,
    "name": "Arges",
    "countryCode": 180
  },
  {
    "stateCode": 2937,
    "name": "Bacau",
    "countryCode": 180
  },
  {
    "stateCode": 2938,
    "name": "Bihor",
    "countryCode": 180
  },
  {
    "stateCode": 2939,
    "name": "Bistrita-Nasaud",
    "countryCode": 180
  },
  {
    "stateCode": 2940,
    "name": "Botosani",
    "countryCode": 180
  },
  {
    "stateCode": 2941,
    "name": "Braila",
    "countryCode": 180
  },
  {
    "stateCode": 2942,
    "name": "Brasov",
    "countryCode": 180
  },
  {
    "stateCode": 2943,
    "name": "Bucuresti",
    "countryCode": 180
  },
  {
    "stateCode": 2944,
    "name": "Buzau",
    "countryCode": 180
  },
  {
    "stateCode": 2945,
    "name": "Calarasi",
    "countryCode": 180
  },
  {
    "stateCode": 2946,
    "name": "Caras-Severin",
    "countryCode": 180
  },
  {
    "stateCode": 2947,
    "name": "Cluj",
    "countryCode": 180
  },
  {
    "stateCode": 2948,
    "name": "Constanta",
    "countryCode": 180
  },
  {
    "stateCode": 2949,
    "name": "Covasna",
    "countryCode": 180
  },
  {
    "stateCode": 2950,
    "name": "Dambovita",
    "countryCode": 180
  },
  {
    "stateCode": 2951,
    "name": "Dolj",
    "countryCode": 180
  },
  {
    "stateCode": 2952,
    "name": "Galati",
    "countryCode": 180
  },
  {
    "stateCode": 2953,
    "name": "Giurgiu",
    "countryCode": 180
  },
  {
    "stateCode": 2954,
    "name": "Gorj",
    "countryCode": 180
  },
  {
    "stateCode": 2955,
    "name": "Harghita",
    "countryCode": 180
  },
  {
    "stateCode": 2956,
    "name": "Hunedoara",
    "countryCode": 180
  },
  {
    "stateCode": 2957,
    "name": "Ialomita",
    "countryCode": 180
  },
  {
    "stateCode": 2958,
    "name": "Iasi",
    "countryCode": 180
  },
  {
    "stateCode": 2959,
    "name": "Ilfov",
    "countryCode": 180
  },
  {
    "stateCode": 2960,
    "name": "Maramures",
    "countryCode": 180
  },
  {
    "stateCode": 2961,
    "name": "Mehedinti",
    "countryCode": 180
  },
  {
    "stateCode": 2962,
    "name": "Mures",
    "countryCode": 180
  },
  {
    "stateCode": 2963,
    "name": "Neamt",
    "countryCode": 180
  },
  {
    "stateCode": 2964,
    "name": "Olt",
    "countryCode": 180
  },
  {
    "stateCode": 2965,
    "name": "Prahova",
    "countryCode": 180
  },
  {
    "stateCode": 2966,
    "name": "Salaj",
    "countryCode": 180
  },
  {
    "stateCode": 2967,
    "name": "Satu Mare",
    "countryCode": 180
  },
  {
    "stateCode": 2968,
    "name": "Sibiu",
    "countryCode": 180
  },
  {
    "stateCode": 2969,
    "name": "Sondelor",
    "countryCode": 180
  },
  {
    "stateCode": 2970,
    "name": "Suceava",
    "countryCode": 180
  },
  {
    "stateCode": 2971,
    "name": "Teleorman",
    "countryCode": 180
  },
  {
    "stateCode": 2972,
    "name": "Timis",
    "countryCode": 180
  },
  {
    "stateCode": 2973,
    "name": "Tulcea",
    "countryCode": 180
  },
  {
    "stateCode": 2974,
    "name": "Valcea",
    "countryCode": 180
  },
  {
    "stateCode": 2975,
    "name": "Vaslui",
    "countryCode": 180
  },
  {
    "stateCode": 2976,
    "name": "Vrancea",
    "countryCode": 180
  },
  {
    "stateCode": 2977,
    "name": "Adygeja",
    "countryCode": 181
  },
  {
    "stateCode": 2978,
    "name": "Aga",
    "countryCode": 181
  },
  {
    "stateCode": 2979,
    "name": "Alanija",
    "countryCode": 181
  },
  {
    "stateCode": 2980,
    "name": "Altaj",
    "countryCode": 181
  },
  {
    "stateCode": 2981,
    "name": "Amur",
    "countryCode": 181
  },
  {
    "stateCode": 2982,
    "name": "Arhangelsk",
    "countryCode": 181
  },
  {
    "stateCode": 2983,
    "name": "Astrahan",
    "countryCode": 181
  },
  {
    "stateCode": 2984,
    "name": "Bashkortostan",
    "countryCode": 181
  },
  {
    "stateCode": 2985,
    "name": "Belgorod",
    "countryCode": 181
  },
  {
    "stateCode": 2986,
    "name": "Brjansk",
    "countryCode": 181
  },
  {
    "stateCode": 2987,
    "name": "Burjatija",
    "countryCode": 181
  },
  {
    "stateCode": 2988,
    "name": "Chechenija",
    "countryCode": 181
  },
  {
    "stateCode": 2989,
    "name": "Cheljabinsk",
    "countryCode": 181
  },
  {
    "stateCode": 2990,
    "name": "Chita",
    "countryCode": 181
  },
  {
    "stateCode": 2991,
    "name": "Chukotka",
    "countryCode": 181
  },
  {
    "stateCode": 2992,
    "name": "Chuvashija",
    "countryCode": 181
  },
  {
    "stateCode": 2993,
    "name": "Dagestan",
    "countryCode": 181
  },
  {
    "stateCode": 2994,
    "name": "Evenkija",
    "countryCode": 181
  },
  {
    "stateCode": 2995,
    "name": "Gorno-Altaj",
    "countryCode": 181
  },
  {
    "stateCode": 2996,
    "name": "Habarovsk",
    "countryCode": 181
  },
  {
    "stateCode": 2997,
    "name": "Hakasija",
    "countryCode": 181
  },
  {
    "stateCode": 2998,
    "name": "Hanty-Mansija",
    "countryCode": 181
  },
  {
    "stateCode": 2999,
    "name": "Ingusetija",
    "countryCode": 181
  },
  {
    "stateCode": 3000,
    "name": "Irkutsk",
    "countryCode": 181
  },
  {
    "stateCode": 3001,
    "name": "Ivanovo",
    "countryCode": 181
  },
  {
    "stateCode": 3002,
    "name": "Jamalo-Nenets",
    "countryCode": 181
  },
  {
    "stateCode": 3003,
    "name": "Jaroslavl",
    "countryCode": 181
  },
  {
    "stateCode": 3004,
    "name": "Jevrej",
    "countryCode": 181
  },
  {
    "stateCode": 3005,
    "name": "Kabardino-Balkarija",
    "countryCode": 181
  },
  {
    "stateCode": 3006,
    "name": "Kaliningrad",
    "countryCode": 181
  },
  {
    "stateCode": 3007,
    "name": "Kalmykija",
    "countryCode": 181
  },
  {
    "stateCode": 3008,
    "name": "Kaluga",
    "countryCode": 181
  },
  {
    "stateCode": 3009,
    "name": "Kamchatka",
    "countryCode": 181
  },
  {
    "stateCode": 3010,
    "name": "Karachaj-Cherkessija",
    "countryCode": 181
  },
  {
    "stateCode": 3011,
    "name": "Karelija",
    "countryCode": 181
  },
  {
    "stateCode": 3012,
    "name": "Kemerovo",
    "countryCode": 181
  },
  {
    "stateCode": 3013,
    "name": "Khabarovskiy Kray",
    "countryCode": 181
  },
  {
    "stateCode": 3014,
    "name": "Kirov",
    "countryCode": 181
  },
  {
    "stateCode": 3015,
    "name": "Komi",
    "countryCode": 181
  },
  {
    "stateCode": 3016,
    "name": "Komi-Permjakija",
    "countryCode": 181
  },
  {
    "stateCode": 3017,
    "name": "Korjakija",
    "countryCode": 181
  },
  {
    "stateCode": 3018,
    "name": "Kostroma",
    "countryCode": 181
  },
  {
    "stateCode": 3019,
    "name": "Krasnodar",
    "countryCode": 181
  },
  {
    "stateCode": 3020,
    "name": "Krasnojarsk",
    "countryCode": 181
  },
  {
    "stateCode": 3021,
    "name": "Krasnoyarskiy Kray",
    "countryCode": 181
  },
  {
    "stateCode": 3022,
    "name": "Kurgan",
    "countryCode": 181
  },
  {
    "stateCode": 3023,
    "name": "Kursk",
    "countryCode": 181
  },
  {
    "stateCode": 3024,
    "name": "Leningrad",
    "countryCode": 181
  },
  {
    "stateCode": 3025,
    "name": "Lipeck",
    "countryCode": 181
  },
  {
    "stateCode": 3026,
    "name": "Magadan",
    "countryCode": 181
  },
  {
    "stateCode": 3027,
    "name": "Marij El",
    "countryCode": 181
  },
  {
    "stateCode": 3028,
    "name": "Mordovija",
    "countryCode": 181
  },
  {
    "stateCode": 3029,
    "name": "Moscow",
    "countryCode": 181
  },
  {
    "stateCode": 3030,
    "name": "Moskovskaja Oblast",
    "countryCode": 181
  },
  {
    "stateCode": 3031,
    "name": "Moskovskaya Oblast",
    "countryCode": 181
  },
  {
    "stateCode": 3032,
    "name": "Moskva",
    "countryCode": 181
  },
  {
    "stateCode": 3033,
    "name": "Murmansk",
    "countryCode": 181
  },
  {
    "stateCode": 3034,
    "name": "Nenets",
    "countryCode": 181
  },
  {
    "stateCode": 3035,
    "name": "Nizhnij Novgorod",
    "countryCode": 181
  },
  {
    "stateCode": 3036,
    "name": "Novgorod",
    "countryCode": 181
  },
  {
    "stateCode": 3037,
    "name": "Novokusnezk",
    "countryCode": 181
  },
  {
    "stateCode": 3038,
    "name": "Novosibirsk",
    "countryCode": 181
  },
  {
    "stateCode": 3039,
    "name": "Omsk",
    "countryCode": 181
  },
  {
    "stateCode": 3040,
    "name": "Orenburg",
    "countryCode": 181
  },
  {
    "stateCode": 3041,
    "name": "Orjol",
    "countryCode": 181
  },
  {
    "stateCode": 3042,
    "name": "Penza",
    "countryCode": 181
  },
  {
    "stateCode": 3043,
    "name": "Perm",
    "countryCode": 181
  },
  {
    "stateCode": 3044,
    "name": "Primorje",
    "countryCode": 181
  },
  {
    "stateCode": 3045,
    "name": "Pskov",
    "countryCode": 181
  },
  {
    "stateCode": 3046,
    "name": "Pskovskaya Oblast",
    "countryCode": 181
  },
  {
    "stateCode": 3047,
    "name": "Rjazan",
    "countryCode": 181
  },
  {
    "stateCode": 3048,
    "name": "Rostov",
    "countryCode": 181
  },
  {
    "stateCode": 3049,
    "name": "Saha",
    "countryCode": 181
  },
  {
    "stateCode": 3050,
    "name": "Sahalin",
    "countryCode": 181
  },
  {
    "stateCode": 3051,
    "name": "Samara",
    "countryCode": 181
  },
  {
    "stateCode": 3052,
    "name": "Samarskaya",
    "countryCode": 181
  },
  {
    "stateCode": 3053,
    "name": "Sankt-Peterburg",
    "countryCode": 181
  },
  {
    "stateCode": 3054,
    "name": "Saratov",
    "countryCode": 181
  },
  {
    "stateCode": 3055,
    "name": "Smolensk",
    "countryCode": 181
  },
  {
    "stateCode": 3056,
    "name": "Stavropol",
    "countryCode": 181
  },
  {
    "stateCode": 3057,
    "name": "Sverdlovsk",
    "countryCode": 181
  },
  {
    "stateCode": 3058,
    "name": "Tajmyrija",
    "countryCode": 181
  },
  {
    "stateCode": 3059,
    "name": "Tambov",
    "countryCode": 181
  },
  {
    "stateCode": 3060,
    "name": "Tatarstan",
    "countryCode": 181
  },
  {
    "stateCode": 3061,
    "name": "Tjumen",
    "countryCode": 181
  },
  {
    "stateCode": 3062,
    "name": "Tomsk",
    "countryCode": 181
  },
  {
    "stateCode": 3063,
    "name": "Tula",
    "countryCode": 181
  },
  {
    "stateCode": 3064,
    "name": "Tver",
    "countryCode": 181
  },
  {
    "stateCode": 3065,
    "name": "Tyva",
    "countryCode": 181
  },
  {
    "stateCode": 3066,
    "name": "Udmurtija",
    "countryCode": 181
  },
  {
    "stateCode": 3067,
    "name": "Uljanovsk",
    "countryCode": 181
  },
  {
    "stateCode": 3068,
    "name": "Ulyanovskaya Oblast",
    "countryCode": 181
  },
  {
    "stateCode": 3069,
    "name": "Ust-Orda",
    "countryCode": 181
  },
  {
    "stateCode": 3070,
    "name": "Vladimir",
    "countryCode": 181
  },
  {
    "stateCode": 3071,
    "name": "Volgograd",
    "countryCode": 181
  },
  {
    "stateCode": 3072,
    "name": "Vologda",
    "countryCode": 181
  },
  {
    "stateCode": 3073,
    "name": "Voronezh",
    "countryCode": 181
  },
  {
    "stateCode": 3074,
    "name": "Butare",
    "countryCode": 182
  },
  {
    "stateCode": 3075,
    "name": "Byumba",
    "countryCode": 182
  },
  {
    "stateCode": 3076,
    "name": "Cyangugu",
    "countryCode": 182
  },
  {
    "stateCode": 3077,
    "name": "Gikongoro",
    "countryCode": 182
  },
  {
    "stateCode": 3078,
    "name": "Gisenyi",
    "countryCode": 182
  },
  {
    "stateCode": 3079,
    "name": "Gitarama",
    "countryCode": 182
  },
  {
    "stateCode": 3080,
    "name": "Kibungo",
    "countryCode": 182
  },
  {
    "stateCode": 3081,
    "name": "Kibuye",
    "countryCode": 182
  },
  {
    "stateCode": 3082,
    "name": "Kigali-ngali",
    "countryCode": 182
  },
  {
    "stateCode": 3083,
    "name": "Ruhengeri",
    "countryCode": 182
  },
  {
    "stateCode": 3084,
    "name": "Ascension",
    "countryCode": 183
  },
  {
    "stateCode": 3085,
    "name": "Gough Island",
    "countryCode": 183
  },
  {
    "stateCode": 3086,
    "name": "Saint Helena",
    "countryCode": 183
  },
  {
    "stateCode": 3087,
    "name": "Tristan da Cunha",
    "countryCode": 183
  },
  {
    "stateCode": 3088,
    "name": "Christ Church Nichola Town",
    "countryCode": 184
  },
  {
    "stateCode": 3089,
    "name": "Saint Anne Sandy Point",
    "countryCode": 184
  },
  {
    "stateCode": 3090,
    "name": "Saint George Basseterre",
    "countryCode": 184
  },
  {
    "stateCode": 3091,
    "name": "Saint George Gingerland",
    "countryCode": 184
  },
  {
    "stateCode": 3092,
    "name": "Saint James Windward",
    "countryCode": 184
  },
  {
    "stateCode": 3093,
    "name": "Saint John Capesterre",
    "countryCode": 184
  },
  {
    "stateCode": 3094,
    "name": "Saint John Figtree",
    "countryCode": 184
  },
  {
    "stateCode": 3095,
    "name": "Saint Mary Cayon",
    "countryCode": 184
  },
  {
    "stateCode": 3096,
    "name": "Saint Paul Capesterre",
    "countryCode": 184
  },
  {
    "stateCode": 3097,
    "name": "Saint Paul Charlestown",
    "countryCode": 184
  },
  {
    "stateCode": 3098,
    "name": "Saint Peter Basseterre",
    "countryCode": 184
  },
  {
    "stateCode": 3099,
    "name": "Saint Thomas Lowland",
    "countryCode": 184
  },
  {
    "stateCode": 3100,
    "name": "Saint Thomas Middle Island",
    "countryCode": 184
  },
  {
    "stateCode": 3101,
    "name": "Trinity Palmetto Point",
    "countryCode": 184
  },
  {
    "stateCode": 3102,
    "name": "Anse-la-Raye",
    "countryCode": 185
  },
  {
    "stateCode": 3103,
    "name": "Canaries",
    "countryCode": 185
  },
  {
    "stateCode": 3104,
    "name": "Castries",
    "countryCode": 185
  },
  {
    "stateCode": 3105,
    "name": "Choiseul",
    "countryCode": 185
  },
  {
    "stateCode": 3106,
    "name": "Dennery",
    "countryCode": 185
  },
  {
    "stateCode": 3107,
    "name": "Gros Inlet",
    "countryCode": 185
  },
  {
    "stateCode": 3108,
    "name": "Laborie",
    "countryCode": 185
  },
  {
    "stateCode": 3109,
    "name": "Micoud",
    "countryCode": 185
  },
  {
    "stateCode": 3110,
    "name": "Soufriere",
    "countryCode": 185
  },
  {
    "stateCode": 3111,
    "name": "Vieux Fort",
    "countryCode": 185
  },
  {
    "stateCode": 3112,
    "name": "Miquelon-Langlade",
    "countryCode": 186
  },
  {
    "stateCode": 3113,
    "name": "Saint-Pierre",
    "countryCode": 186
  },
  {
    "stateCode": 3114,
    "name": "Charlotte",
    "countryCode": 187
  },
  {
    "stateCode": 3115,
    "name": "Grenadines",
    "countryCode": 187
  },
  {
    "stateCode": 3116,
    "name": "Saint Andrew",
    "countryCode": 187
  },
  {
    "stateCode": 3117,
    "name": "Saint David",
    "countryCode": 187
  },
  {
    "stateCode": 3118,
    "name": "Saint George",
    "countryCode": 187
  },
  {
    "stateCode": 3119,
    "name": "Saint Patrick",
    "countryCode": 187
  },
  {
    "stateCode": 3120,
    "name": "A\\ana, 188"
  },
  {
    "stateCode": 3121,
    "name": "Aiga-i-le-Tai",
    "countryCode": 188
  },
  {
    "stateCode": 3122,
    "name": "Atua",
    "countryCode": 188
  },
  {
    "stateCode": 3123,
    "name": "Fa\\asaleleaga, 188"
  },
  {
    "stateCode": 3124,
    "name": "Gaga\\emauga, 188"
  },
  {
    "stateCode": 3125,
    "name": "Gagaifomauga",
    "countryCode": 188
  },
  {
    "stateCode": 3126,
    "name": "Palauli",
    "countryCode": 188
  },
  {
    "stateCode": 3127,
    "name": "Satupa\\itea, 188"
  },
  {
    "stateCode": 3128,
    "name": "Tuamasaga",
    "countryCode": 188
  },
  {
    "stateCode": 3129,
    "name": "Va\\a-o-Fonoti, 188"
  },
  {
    "stateCode": 3130,
    "name": "Vaisigano",
    "countryCode": 188
  },
  {
    "stateCode": 3131,
    "name": "Acquaviva",
    "countryCode": 189
  },
  {
    "stateCode": 3132,
    "name": "Borgo Maggiore",
    "countryCode": 189
  },
  {
    "stateCode": 3133,
    "name": "Chiesanuova",
    "countryCode": 189
  },
  {
    "stateCode": 3134,
    "name": "Domagnano",
    "countryCode": 189
  },
  {
    "stateCode": 3135,
    "name": "Faetano",
    "countryCode": 189
  },
  {
    "stateCode": 3136,
    "name": "Fiorentino",
    "countryCode": 189
  },
  {
    "stateCode": 3137,
    "name": "Montegiardino",
    "countryCode": 189
  },
  {
    "stateCode": 3138,
    "name": "San Marino",
    "countryCode": 189
  },
  {
    "stateCode": 3139,
    "name": "Serravalle",
    "countryCode": 189
  },
  {
    "stateCode": 3140,
    "name": "Agua Grande",
    "countryCode": 190
  },
  {
    "stateCode": 3141,
    "name": "Cantagalo",
    "countryCode": 190
  },
  {
    "stateCode": 3142,
    "name": "Lemba",
    "countryCode": 190
  },
  {
    "stateCode": 3143,
    "name": "Lobata",
    "countryCode": 190
  },
  {
    "stateCode": 3144,
    "name": "Me-Zochi",
    "countryCode": 190
  },
  {
    "stateCode": 3145,
    "name": "Pague",
    "countryCode": 190
  },
  {
    "stateCode": 3146,
    "name": "Al Khobar",
    "countryCode": 191
  },
  {
    "stateCode": 3147,
    "name": "Aseer",
    "countryCode": 191
  },
  {
    "stateCode": 3148,
    "name": "Ash Sharqiyah",
    "countryCode": 191
  },
  {
    "stateCode": 3149,
    "name": "Asir",
    "countryCode": 191
  },
  {
    "stateCode": 3150,
    "name": "Central Province",
    "countryCode": 191
  },
  {
    "stateCode": 3151,
    "name": "Eastern Province",
    "countryCode": 191
  },
  {
    "stateCode": 3152,
    "name": "Ha\\il, 191"
  },
  {
    "stateCode": 3153,
    "name": "Jawf",
    "countryCode": 191
  },
  {
    "stateCode": 3154,
    "name": "Jizan",
    "countryCode": 191
  },
  {
    "stateCode": 3155,
    "name": "Makkah",
    "countryCode": 191
  },
  {
    "stateCode": 3156,
    "name": "Najran",
    "countryCode": 191
  },
  {
    "stateCode": 3157,
    "name": "Qasim",
    "countryCode": 191
  },
  {
    "stateCode": 3158,
    "name": "Tabuk",
    "countryCode": 191
  },
  {
    "stateCode": 3159,
    "name": "Western Province",
    "countryCode": 191
  },
  {
    "stateCode": 3160,
    "name": "al-Bahah",
    "countryCode": 191
  },
  {
    "stateCode": 3161,
    "name": "al-Hudud-ash-Shamaliyah",
    "countryCode": 191
  },
  {
    "stateCode": 3162,
    "name": "al-Madinah",
    "countryCode": 191
  },
  {
    "stateCode": 3163,
    "name": "ar-Riyad",
    "countryCode": 191
  },
  {
    "stateCode": 3164,
    "name": "Dakar",
    "countryCode": 192
  },
  {
    "stateCode": 3165,
    "name": "Diourbel",
    "countryCode": 192
  },
  {
    "stateCode": 3166,
    "name": "Fatick",
    "countryCode": 192
  },
  {
    "stateCode": 3167,
    "name": "Kaolack",
    "countryCode": 192
  },
  {
    "stateCode": 3168,
    "name": "Kolda",
    "countryCode": 192
  },
  {
    "stateCode": 3169,
    "name": "Louga",
    "countryCode": 192
  },
  {
    "stateCode": 3170,
    "name": "Saint-Louis",
    "countryCode": 192
  },
  {
    "stateCode": 3171,
    "name": "Tambacounda",
    "countryCode": 192
  },
  {
    "stateCode": 3172,
    "name": "Thies",
    "countryCode": 192
  },
  {
    "stateCode": 3173,
    "name": "Ziguinchor",
    "countryCode": 192
  },
  {
    "stateCode": 3174,
    "name": "Central Serbia",
    "countryCode": 193
  },
  {
    "stateCode": 3175,
    "name": "Kosovo and Metohija",
    "countryCode": 193
  },
  {
    "stateCode": 3176,
    "name": "Vojvodina",
    "countryCode": 193
  },
  {
    "stateCode": 3177,
    "name": "Anse Boileau",
    "countryCode": 194
  },
  {
    "stateCode": 3178,
    "name": "Anse Royale",
    "countryCode": 194
  },
  {
    "stateCode": 3179,
    "name": "Cascade",
    "countryCode": 194
  },
  {
    "stateCode": 3180,
    "name": "Takamaka",
    "countryCode": 194
  },
  {
    "stateCode": 3181,
    "name": "Victoria",
    "countryCode": 194
  },
  {
    "stateCode": 3182,
    "name": "Eastern",
    "countryCode": 195
  },
  {
    "stateCode": 3183,
    "name": "Northern",
    "countryCode": 195
  },
  {
    "stateCode": 3184,
    "name": "Southern",
    "countryCode": 195
  },
  {
    "stateCode": 3185,
    "name": "Western",
    "countryCode": 195
  },
  {
    "stateCode": 3186,
    "name": "Singapore",
    "countryCode": 196
  },
  {
    "stateCode": 3187,
    "name": "Banskobystricky",
    "countryCode": 197
  },
  {
    "stateCode": 3188,
    "name": "Bratislavsky",
    "countryCode": 197
  },
  {
    "stateCode": 3189,
    "name": "Kosicky",
    "countryCode": 197
  },
  {
    "stateCode": 3190,
    "name": "Nitriansky",
    "countryCode": 197
  },
  {
    "stateCode": 3191,
    "name": "Presovsky",
    "countryCode": 197
  },
  {
    "stateCode": 3192,
    "name": "Trenciansky",
    "countryCode": 197
  },
  {
    "stateCode": 3193,
    "name": "Trnavsky",
    "countryCode": 197
  },
  {
    "stateCode": 3194,
    "name": "Zilinsky",
    "countryCode": 197
  },
  {
    "stateCode": 3195,
    "name": "Benedikt",
    "countryCode": 198
  },
  {
    "stateCode": 3196,
    "name": "Gorenjska",
    "countryCode": 198
  },
  {
    "stateCode": 3197,
    "name": "Gorishka",
    "countryCode": 198
  },
  {
    "stateCode": 3198,
    "name": "Jugovzhodna Slovenija",
    "countryCode": 198
  },
  {
    "stateCode": 3199,
    "name": "Koroshka",
    "countryCode": 198
  },
  {
    "stateCode": 3200,
    "name": "Notranjsko-krashka",
    "countryCode": 198
  },
  {
    "stateCode": 3201,
    "name": "Obalno-krashka",
    "countryCode": 198
  },
  {
    "stateCode": 3202,
    "name": "Obcina Domzale",
    "countryCode": 198
  },
  {
    "stateCode": 3203,
    "name": "Obcina Vitanje",
    "countryCode": 198
  },
  {
    "stateCode": 3204,
    "name": "Osrednjeslovenska",
    "countryCode": 198
  },
  {
    "stateCode": 3205,
    "name": "Podravska",
    "countryCode": 198
  },
  {
    "stateCode": 3206,
    "name": "Pomurska",
    "countryCode": 198
  },
  {
    "stateCode": 3207,
    "name": "Savinjska",
    "countryCode": 198
  },
  {
    "stateCode": 3208,
    "name": "Slovenian Littoral",
    "countryCode": 198
  },
  {
    "stateCode": 3209,
    "name": "Spodnjeposavska",
    "countryCode": 198
  },
  {
    "stateCode": 3210,
    "name": "Zasavska",
    "countryCode": 198
  },
  {
    "stateCode": 3211,
    "name": "Pitcairn",
    "countryCode": 199
  },
  {
    "stateCode": 3212,
    "name": "Central",
    "countryCode": 200
  },
  {
    "stateCode": 3213,
    "name": "Choiseul",
    "countryCode": 200
  },
  {
    "stateCode": 3214,
    "name": "Guadalcanal",
    "countryCode": 200
  },
  {
    "stateCode": 3215,
    "name": "Isabel",
    "countryCode": 200
  },
  {
    "stateCode": 3216,
    "name": "Makira and Ulawa",
    "countryCode": 200
  },
  {
    "stateCode": 3217,
    "name": "Malaita",
    "countryCode": 200
  },
  {
    "stateCode": 3218,
    "name": "Rennell and Bellona",
    "countryCode": 200
  },
  {
    "stateCode": 3219,
    "name": "Temotu",
    "countryCode": 200
  },
  {
    "stateCode": 3220,
    "name": "Western",
    "countryCode": 200
  },
  {
    "stateCode": 3221,
    "name": "Awdal",
    "countryCode": 201
  },
  {
    "stateCode": 3222,
    "name": "Bakol",
    "countryCode": 201
  },
  {
    "stateCode": 3223,
    "name": "Banadir",
    "countryCode": 201
  },
  {
    "stateCode": 3224,
    "name": "Bari",
    "countryCode": 201
  },
  {
    "stateCode": 3225,
    "name": "Bay",
    "countryCode": 201
  },
  {
    "stateCode": 3226,
    "name": "Galgudug",
    "countryCode": 201
  },
  {
    "stateCode": 3227,
    "name": "Gedo",
    "countryCode": 201
  },
  {
    "stateCode": 3228,
    "name": "Hiran",
    "countryCode": 201
  },
  {
    "stateCode": 3229,
    "name": "Jubbada Hose",
    "countryCode": 201
  },
  {
    "stateCode": 3230,
    "name": "Jubbadha Dexe",
    "countryCode": 201
  },
  {
    "stateCode": 3231,
    "name": "Mudug",
    "countryCode": 201
  },
  {
    "stateCode": 3232,
    "name": "Nugal",
    "countryCode": 201
  },
  {
    "stateCode": 3233,
    "name": "Sanag",
    "countryCode": 201
  },
  {
    "stateCode": 3234,
    "name": "Shabellaha Dhexe",
    "countryCode": 201
  },
  {
    "stateCode": 3235,
    "name": "Shabellaha Hose",
    "countryCode": 201
  },
  {
    "stateCode": 3236,
    "name": "Togdher",
    "countryCode": 201
  },
  {
    "stateCode": 3237,
    "name": "Woqoyi Galbed",
    "countryCode": 201
  },
  {
    "stateCode": 3238,
    "name": "Eastern Cape",
    "countryCode": 202
  },
  {
    "stateCode": 3239,
    "name": "Free State",
    "countryCode": 202
  },
  {
    "stateCode": 3240,
    "name": "Gauteng",
    "countryCode": 202
  },
  {
    "stateCode": 3241,
    "name": "Kempton Park",
    "countryCode": 202
  },
  {
    "stateCode": 3242,
    "name": "Kramerville",
    "countryCode": 202
  },
  {
    "stateCode": 3243,
    "name": "KwaZulu Natal",
    "countryCode": 202
  },
  {
    "stateCode": 3244,
    "name": "Limpopo",
    "countryCode": 202
  },
  {
    "stateCode": 3245,
    "name": "Mpumalanga",
    "countryCode": 202
  },
  {
    "stateCode": 3246,
    "name": "North West",
    "countryCode": 202
  },
  {
    "stateCode": 3247,
    "name": "Northern Cape",
    "countryCode": 202
  },
  {
    "stateCode": 3248,
    "name": "Parow",
    "countryCode": 202
  },
  {
    "stateCode": 3249,
    "name": "Table View",
    "countryCode": 202
  },
  {
    "stateCode": 3250,
    "name": "Umtentweni",
    "countryCode": 202
  },
  {
    "stateCode": 3251,
    "name": "Western Cape",
    "countryCode": 202
  },
  {
    "stateCode": 3252,
    "name": "South Georgia",
    "countryCode": 203
  },
  {
    "stateCode": 3253,
    "name": "Central Equatoria",
    "countryCode": 204
  },
  {
    "stateCode": 3254,
    "name": "A Coruna",
    "countryCode": 205
  },
  {
    "stateCode": 3255,
    "name": "Alacant",
    "countryCode": 205
  },
  {
    "stateCode": 3256,
    "name": "Alava",
    "countryCode": 205
  },
  {
    "stateCode": 3257,
    "name": "Albacete",
    "countryCode": 205
  },
  {
    "stateCode": 3258,
    "name": "Almeria",
    "countryCode": 205
  },
  {
    "stateCode": 3259,
    "name": "Andalucia",
    "countryCode": 205
  },
  {
    "stateCode": 3260,
    "name": "Asturias",
    "countryCode": 205
  },
  {
    "stateCode": 3261,
    "name": "Avila",
    "countryCode": 205
  },
  {
    "stateCode": 3262,
    "name": "Badajoz",
    "countryCode": 205
  },
  {
    "stateCode": 3263,
    "name": "Balears",
    "countryCode": 205
  },
  {
    "stateCode": 3264,
    "name": "Barcelona",
    "countryCode": 205
  },
  {
    "stateCode": 3265,
    "name": "Bertamirans",
    "countryCode": 205
  },
  {
    "stateCode": 3266,
    "name": "Biscay",
    "countryCode": 205
  },
  {
    "stateCode": 3267,
    "name": "Burgos",
    "countryCode": 205
  },
  {
    "stateCode": 3268,
    "name": "Caceres",
    "countryCode": 205
  },
  {
    "stateCode": 3269,
    "name": "Cadiz",
    "countryCode": 205
  },
  {
    "stateCode": 3270,
    "name": "Cantabria",
    "countryCode": 205
  },
  {
    "stateCode": 3271,
    "name": "Castello",
    "countryCode": 205
  },
  {
    "stateCode": 3272,
    "name": "Catalunya",
    "countryCode": 205
  },
  {
    "stateCode": 3273,
    "name": "Ceuta",
    "countryCode": 205
  },
  {
    "stateCode": 3274,
    "name": "Ciudad Real",
    "countryCode": 205
  },
  {
    "stateCode": 3275,
    "name": "Comunidad Autonoma de Canarias",
    "countryCode": 205
  },
  {
    "stateCode": 3276,
    "name": "Comunidad Autonoma de Cataluna",
    "countryCode": 205
  },
  {
    "stateCode": 3277,
    "name": "Comunidad Autonoma de Galicia",
    "countryCode": 205
  },
  {
    "stateCode": 3278,
    "name": "Comunidad Autonoma de las Isla",
    "countryCode": 205
  },
  {
    "stateCode": 3279,
    "name": "Comunidad Autonoma del Princip",
    "countryCode": 205
  },
  {
    "stateCode": 3280,
    "name": "Comunidad Valenciana",
    "countryCode": 205
  },
  {
    "stateCode": 3281,
    "name": "Cordoba",
    "countryCode": 205
  },
  {
    "stateCode": 3282,
    "name": "Cuenca",
    "countryCode": 205
  },
  {
    "stateCode": 3283,
    "name": "Gipuzkoa",
    "countryCode": 205
  },
  {
    "stateCode": 3284,
    "name": "Girona",
    "countryCode": 205
  },
  {
    "stateCode": 3285,
    "name": "Granada",
    "countryCode": 205
  },
  {
    "stateCode": 3286,
    "name": "Guadalajara",
    "countryCode": 205
  },
  {
    "stateCode": 3287,
    "name": "Guipuzcoa",
    "countryCode": 205
  },
  {
    "stateCode": 3288,
    "name": "Huelva",
    "countryCode": 205
  },
  {
    "stateCode": 3289,
    "name": "Huesca",
    "countryCode": 205
  },
  {
    "stateCode": 3290,
    "name": "Jaen",
    "countryCode": 205
  },
  {
    "stateCode": 3291,
    "name": "La Rioja",
    "countryCode": 205
  },
  {
    "stateCode": 3292,
    "name": "Las Palmas",
    "countryCode": 205
  },
  {
    "stateCode": 3293,
    "name": "Leon",
    "countryCode": 205
  },
  {
    "stateCode": 3294,
    "name": "Lerida",
    "countryCode": 205
  },
  {
    "stateCode": 3295,
    "name": "Lleida",
    "countryCode": 205
  },
  {
    "stateCode": 3296,
    "name": "Lugo",
    "countryCode": 205
  },
  {
    "stateCode": 3297,
    "name": "Madrid",
    "countryCode": 205
  },
  {
    "stateCode": 3298,
    "name": "Malaga",
    "countryCode": 205
  },
  {
    "stateCode": 3299,
    "name": "Melilla",
    "countryCode": 205
  },
  {
    "stateCode": 3300,
    "name": "Murcia",
    "countryCode": 205
  },
  {
    "stateCode": 3301,
    "name": "Navarra",
    "countryCode": 205
  },
  {
    "stateCode": 3302,
    "name": "Ourense",
    "countryCode": 205
  },
  {
    "stateCode": 3303,
    "name": "Pais Vasco",
    "countryCode": 205
  },
  {
    "stateCode": 3304,
    "name": "Palencia",
    "countryCode": 205
  },
  {
    "stateCode": 3305,
    "name": "Pontevedra",
    "countryCode": 205
  },
  {
    "stateCode": 3306,
    "name": "Salamanca",
    "countryCode": 205
  },
  {
    "stateCode": 3307,
    "name": "Santa Cruz de Tenerife",
    "countryCode": 205
  },
  {
    "stateCode": 3308,
    "name": "Segovia",
    "countryCode": 205
  },
  {
    "stateCode": 3309,
    "name": "Sevilla",
    "countryCode": 205
  },
  {
    "stateCode": 3310,
    "name": "Soria",
    "countryCode": 205
  },
  {
    "stateCode": 3311,
    "name": "Tarragona",
    "countryCode": 205
  },
  {
    "stateCode": 3312,
    "name": "Tenerife",
    "countryCode": 205
  },
  {
    "stateCode": 3313,
    "name": "Teruel",
    "countryCode": 205
  },
  {
    "stateCode": 3314,
    "name": "Toledo",
    "countryCode": 205
  },
  {
    "stateCode": 3315,
    "name": "Valencia",
    "countryCode": 205
  },
  {
    "stateCode": 3316,
    "name": "Valladolid",
    "countryCode": 205
  },
  {
    "stateCode": 3317,
    "name": "Vizcaya",
    "countryCode": 205
  },
  {
    "stateCode": 3318,
    "name": "Zamora",
    "countryCode": 205
  },
  {
    "stateCode": 3319,
    "name": "Zaragoza",
    "countryCode": 205
  },
  {
    "stateCode": 3320,
    "name": "Amparai",
    "countryCode": 206
  },
  {
    "stateCode": 3321,
    "name": "Anuradhapuraya",
    "countryCode": 206
  },
  {
    "stateCode": 3322,
    "name": "Badulla",
    "countryCode": 206
  },
  {
    "stateCode": 3323,
    "name": "Boralesgamuwa",
    "countryCode": 206
  },
  {
    "stateCode": 3324,
    "name": "Colombo",
    "countryCode": 206
  },
  {
    "stateCode": 3325,
    "name": "Galla",
    "countryCode": 206
  },
  {
    "stateCode": 3326,
    "name": "Gampaha",
    "countryCode": 206
  },
  {
    "stateCode": 3327,
    "name": "Hambantota",
    "countryCode": 206
  },
  {
    "stateCode": 3328,
    "name": "Kalatura",
    "countryCode": 206
  },
  {
    "stateCode": 3329,
    "name": "Kegalla",
    "countryCode": 206
  },
  {
    "stateCode": 3330,
    "name": "Kilinochchi",
    "countryCode": 206
  },
  {
    "stateCode": 3331,
    "name": "Kurunegala",
    "countryCode": 206
  },
  {
    "stateCode": 3332,
    "name": "Madakalpuwa",
    "countryCode": 206
  },
  {
    "stateCode": 3333,
    "name": "Maha Nuwara",
    "countryCode": 206
  },
  {
    "stateCode": 3334,
    "name": "Malwana",
    "countryCode": 206
  },
  {
    "stateCode": 3335,
    "name": "Mannarama",
    "countryCode": 206
  },
  {
    "stateCode": 3336,
    "name": "Matale",
    "countryCode": 206
  },
  {
    "stateCode": 3337,
    "name": "Matara",
    "countryCode": 206
  },
  {
    "stateCode": 3338,
    "name": "Monaragala",
    "countryCode": 206
  },
  {
    "stateCode": 3339,
    "name": "Mullaitivu",
    "countryCode": 206
  },
  {
    "stateCode": 3340,
    "name": "North Eastern Province",
    "countryCode": 206
  },
  {
    "stateCode": 3341,
    "name": "North Western Province",
    "countryCode": 206
  },
  {
    "stateCode": 3342,
    "name": "Nuwara Eliya",
    "countryCode": 206
  },
  {
    "stateCode": 3343,
    "name": "Polonnaruwa",
    "countryCode": 206
  },
  {
    "stateCode": 3344,
    "name": "Puttalama",
    "countryCode": 206
  },
  {
    "stateCode": 3345,
    "name": "Ratnapuraya",
    "countryCode": 206
  },
  {
    "stateCode": 3346,
    "name": "Southern Province",
    "countryCode": 206
  },
  {
    "stateCode": 3347,
    "name": "Tirikunamalaya",
    "countryCode": 206
  },
  {
    "stateCode": 3348,
    "name": "Tuscany",
    "countryCode": 206
  },
  {
    "stateCode": 3349,
    "name": "Vavuniyawa",
    "countryCode": 206
  },
  {
    "stateCode": 3350,
    "name": "Western Province",
    "countryCode": 206
  },
  {
    "stateCode": 3351,
    "name": "Yapanaya",
    "countryCode": 206
  },
  {
    "stateCode": 3352,
    "name": "kadawatha",
    "countryCode": 206
  },
  {
    "stateCode": 3353,
    "name": "A\\ali-an-Nil, 207"
  },
  {
    "stateCode": 3354,
    "name": "Bahr-al-Jabal",
    "countryCode": 207
  },
  {
    "stateCode": 3355,
    "name": "Central Equatoria",
    "countryCode": 207
  },
  {
    "stateCode": 3356,
    "name": "Gharb Bahr-al-Ghazal",
    "countryCode": 207
  },
  {
    "stateCode": 3357,
    "name": "Gharb Darfur",
    "countryCode": 207
  },
  {
    "stateCode": 3358,
    "name": "Gharb Kurdufan",
    "countryCode": 207
  },
  {
    "stateCode": 3359,
    "name": "Gharb-al-Istiwa\\iyah, 207"
  },
  {
    "stateCode": 3360,
    "name": "Janub Darfur",
    "countryCode": 207
  },
  {
    "stateCode": 3361,
    "name": "Janub Kurdufan",
    "countryCode": 207
  },
  {
    "stateCode": 3362,
    "name": "Junqali",
    "countryCode": 207
  },
  {
    "stateCode": 3363,
    "name": "Kassala",
    "countryCode": 207
  },
  {
    "stateCode": 3364,
    "name": "Nahr-an-Nil",
    "countryCode": 207
  },
  {
    "stateCode": 3365,
    "name": "Shamal Bahr-al-Ghazal",
    "countryCode": 207
  },
  {
    "stateCode": 3366,
    "name": "Shamal Darfur",
    "countryCode": 207
  },
  {
    "stateCode": 3367,
    "name": "Shamal Kurdufan",
    "countryCode": 207
  },
  {
    "stateCode": 3368,
    "name": "Sharq-al-Istiwa\\iyah, 207"
  },
  {
    "stateCode": 3369,
    "name": "Sinnar",
    "countryCode": 207
  },
  {
    "stateCode": 3370,
    "name": "Warab",
    "countryCode": 207
  },
  {
    "stateCode": 3371,
    "name": "Wilayat al Khartum",
    "countryCode": 207
  },
  {
    "stateCode": 3372,
    "name": "al-Bahr-al-Ahmar",
    "countryCode": 207
  },
  {
    "stateCode": 3373,
    "name": "al-Buhayrat",
    "countryCode": 207
  },
  {
    "stateCode": 3374,
    "name": "al-Jazirah",
    "countryCode": 207
  },
  {
    "stateCode": 3375,
    "name": "al-Khartum",
    "countryCode": 207
  },
  {
    "stateCode": 3376,
    "name": "al-Qadarif",
    "countryCode": 207
  },
  {
    "stateCode": 3377,
    "name": "al-Wahdah",
    "countryCode": 207
  },
  {
    "stateCode": 3378,
    "name": "an-Nil-al-Abyad",
    "countryCode": 207
  },
  {
    "stateCode": 3379,
    "name": "an-Nil-al-Azraq",
    "countryCode": 207
  },
  {
    "stateCode": 3380,
    "name": "ash-Shamaliyah",
    "countryCode": 207
  },
  {
    "stateCode": 3381,
    "name": "Brokopondo",
    "countryCode": 208
  },
  {
    "stateCode": 3382,
    "name": "Commewijne",
    "countryCode": 208
  },
  {
    "stateCode": 3383,
    "name": "Coronie",
    "countryCode": 208
  },
  {
    "stateCode": 3384,
    "name": "Marowijne",
    "countryCode": 208
  },
  {
    "stateCode": 3385,
    "name": "Nickerie",
    "countryCode": 208
  },
  {
    "stateCode": 3386,
    "name": "Para",
    "countryCode": 208
  },
  {
    "stateCode": 3387,
    "name": "Paramaribo",
    "countryCode": 208
  },
  {
    "stateCode": 3388,
    "name": "Saramacca",
    "countryCode": 208
  },
  {
    "stateCode": 3389,
    "name": "Wanica",
    "countryCode": 208
  },
  {
    "stateCode": 3390,
    "name": "Svalbard",
    "countryCode": 209
  },
  {
    "stateCode": 3391,
    "name": "Hhohho",
    "countryCode": 210
  },
  {
    "stateCode": 3392,
    "name": "Lubombo",
    "countryCode": 210
  },
  {
    "stateCode": 3393,
    "name": "Manzini",
    "countryCode": 210
  },
  {
    "stateCode": 3394,
    "name": "Shiselweni",
    "countryCode": 210
  },
  {
    "stateCode": 3395,
    "name": "Alvsborgs Lan",
    "countryCode": 211
  },
  {
    "stateCode": 3396,
    "name": "Angermanland",
    "countryCode": 211
  },
  {
    "stateCode": 3397,
    "name": "Blekinge",
    "countryCode": 211
  },
  {
    "stateCode": 3398,
    "name": "Bohuslan",
    "countryCode": 211
  },
  {
    "stateCode": 3399,
    "name": "Dalarna",
    "countryCode": 211
  },
  {
    "stateCode": 3400,
    "name": "Gavleborg",
    "countryCode": 211
  },
  {
    "stateCode": 3401,
    "name": "Gaza",
    "countryCode": 211
  },
  {
    "stateCode": 3402,
    "name": "Gotland",
    "countryCode": 211
  },
  {
    "stateCode": 3403,
    "name": "Halland",
    "countryCode": 211
  },
  {
    "stateCode": 3404,
    "name": "Jamtland",
    "countryCode": 211
  },
  {
    "stateCode": 3405,
    "name": "Jonkoping",
    "countryCode": 211
  },
  {
    "stateCode": 3406,
    "name": "Kalmar",
    "countryCode": 211
  },
  {
    "stateCode": 3407,
    "name": "Kristianstads",
    "countryCode": 211
  },
  {
    "stateCode": 3408,
    "name": "Kronoberg",
    "countryCode": 211
  },
  {
    "stateCode": 3409,
    "name": "Norrbotten",
    "countryCode": 211
  },
  {
    "stateCode": 3410,
    "name": "Orebro",
    "countryCode": 211
  },
  {
    "stateCode": 3411,
    "name": "Ostergotland",
    "countryCode": 211
  },
  {
    "stateCode": 3412,
    "name": "Saltsjo-Boo",
    "countryCode": 211
  },
  {
    "stateCode": 3413,
    "name": "Skane",
    "countryCode": 211
  },
  {
    "stateCode": 3414,
    "name": "Smaland",
    "countryCode": 211
  },
  {
    "stateCode": 3415,
    "name": "Sodermanland",
    "countryCode": 211
  },
  {
    "stateCode": 3416,
    "name": "Stockholm",
    "countryCode": 211
  },
  {
    "stateCode": 3417,
    "name": "Uppsala",
    "countryCode": 211
  },
  {
    "stateCode": 3418,
    "name": "Varmland",
    "countryCode": 211
  },
  {
    "stateCode": 3419,
    "name": "Vasterbotten",
    "countryCode": 211
  },
  {
    "stateCode": 3420,
    "name": "Vastergotland",
    "countryCode": 211
  },
  {
    "stateCode": 3421,
    "name": "Vasternorrland",
    "countryCode": 211
  },
  {
    "stateCode": 3422,
    "name": "Vastmanland",
    "countryCode": 211
  },
  {
    "stateCode": 3423,
    "name": "Vastra Gotaland",
    "countryCode": 211
  },
  {
    "stateCode": 3424,
    "name": "Aargau",
    "countryCode": 212
  },
  {
    "stateCode": 3425,
    "name": "Appenzell Inner-Rhoden",
    "countryCode": 212
  },
  {
    "stateCode": 3426,
    "name": "Appenzell-Ausser Rhoden",
    "countryCode": 212
  },
  {
    "stateCode": 3427,
    "name": "Basel-Landschaft",
    "countryCode": 212
  },
  {
    "stateCode": 3428,
    "name": "Basel-Stadt",
    "countryCode": 212
  },
  {
    "stateCode": 3429,
    "name": "Bern",
    "countryCode": 212
  },
  {
    "stateCode": 3430,
    "name": "Canton Ticino",
    "countryCode": 212
  },
  {
    "stateCode": 3431,
    "name": "Fribourg",
    "countryCode": 212
  },
  {
    "stateCode": 3432,
    "name": "Geneve",
    "countryCode": 212
  },
  {
    "stateCode": 3433,
    "name": "Glarus",
    "countryCode": 212
  },
  {
    "stateCode": 3434,
    "name": "Graubunden",
    "countryCode": 212
  },
  {
    "stateCode": 3435,
    "name": "Heerbrugg",
    "countryCode": 212
  },
  {
    "stateCode": 3436,
    "name": "Jura",
    "countryCode": 212
  },
  {
    "stateCode": 3437,
    "name": "Kanton Aargau",
    "countryCode": 212
  },
  {
    "stateCode": 3438,
    "name": "Luzern",
    "countryCode": 212
  },
  {
    "stateCode": 3439,
    "name": "Morbio Inferiore",
    "countryCode": 212
  },
  {
    "stateCode": 3440,
    "name": "Muhen",
    "countryCode": 212
  },
  {
    "stateCode": 3441,
    "name": "Neuchatel",
    "countryCode": 212
  },
  {
    "stateCode": 3442,
    "name": "Nidwalden",
    "countryCode": 212
  },
  {
    "stateCode": 3443,
    "name": "Obwalden",
    "countryCode": 212
  },
  {
    "stateCode": 3444,
    "name": "Sankt Gallen",
    "countryCode": 212
  },
  {
    "stateCode": 3445,
    "name": "Schaffhausen",
    "countryCode": 212
  },
  {
    "stateCode": 3446,
    "name": "Schwyz",
    "countryCode": 212
  },
  {
    "stateCode": 3447,
    "name": "Solothurn",
    "countryCode": 212
  },
  {
    "stateCode": 3448,
    "name": "Thurgau",
    "countryCode": 212
  },
  {
    "stateCode": 3449,
    "name": "Ticino",
    "countryCode": 212
  },
  {
    "stateCode": 3450,
    "name": "Uri",
    "countryCode": 212
  },
  {
    "stateCode": 3451,
    "name": "Valais",
    "countryCode": 212
  },
  {
    "stateCode": 3452,
    "name": "Vaud",
    "countryCode": 212
  },
  {
    "stateCode": 3453,
    "name": "Vauffelin",
    "countryCode": 212
  },
  {
    "stateCode": 3454,
    "name": "Zug",
    "countryCode": 212
  },
  {
    "stateCode": 3455,
    "name": "Zurich",
    "countryCode": 212
  },
  {
    "stateCode": 3456,
    "name": "Aleppo",
    "countryCode": 213
  },
  {
    "stateCode": 3457,
    "name": "Dar\\a, 213"
  },
  {
    "stateCode": 3458,
    "name": "Dayr-az-Zawr",
    "countryCode": 213
  },
  {
    "stateCode": 3459,
    "name": "Dimashq",
    "countryCode": 213
  },
  {
    "stateCode": 3460,
    "name": "Halab",
    "countryCode": 213
  },
  {
    "stateCode": 3461,
    "name": "Hamah",
    "countryCode": 213
  },
  {
    "stateCode": 3462,
    "name": "Hims",
    "countryCode": 213
  },
  {
    "stateCode": 3463,
    "name": "Idlib",
    "countryCode": 213
  },
  {
    "stateCode": 3464,
    "name": "Madinat Dimashq",
    "countryCode": 213
  },
  {
    "stateCode": 3465,
    "name": "Tartus",
    "countryCode": 213
  },
  {
    "stateCode": 3466,
    "name": "al-Hasakah",
    "countryCode": 213
  },
  {
    "stateCode": 3467,
    "name": "al-Ladhiqiyah",
    "countryCode": 213
  },
  {
    "stateCode": 3468,
    "name": "al-Qunaytirah",
    "countryCode": 213
  },
  {
    "stateCode": 3469,
    "name": "ar-Raqqah",
    "countryCode": 213
  },
  {
    "stateCode": 3470,
    "name": "as-Suwayda",
    "countryCode": 213
  },
  {
    "stateCode": 3471,
    "name": "Changhwa",
    "countryCode": 214
  },
  {
    "stateCode": 3472,
    "name": "Chiayi Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3473,
    "name": "Chiayi Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3474,
    "name": "Eastern Taipei",
    "countryCode": 214
  },
  {
    "stateCode": 3475,
    "name": "Hsinchu Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3476,
    "name": "Hsinchu Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3477,
    "name": "Hualien",
    "countryCode": 214
  },
  {
    "stateCode": 3478,
    "name": "Ilan",
    "countryCode": 214
  },
  {
    "stateCode": 3479,
    "name": "Kaohsiung Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3480,
    "name": "Kaohsiung Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3481,
    "name": "Keelung Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3482,
    "name": "Kinmen",
    "countryCode": 214
  },
  {
    "stateCode": 3483,
    "name": "Miaoli",
    "countryCode": 214
  },
  {
    "stateCode": 3484,
    "name": "Nantou",
    "countryCode": 214
  },
  {
    "stateCode": 3485,
    "name": "Northern Taiwan",
    "countryCode": 214
  },
  {
    "stateCode": 3486,
    "name": "Penghu",
    "countryCode": 214
  },
  {
    "stateCode": 3487,
    "name": "Pingtung",
    "countryCode": 214
  },
  {
    "stateCode": 3488,
    "name": "Taichung",
    "countryCode": 214
  },
  {
    "stateCode": 3489,
    "name": "Taichung Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3490,
    "name": "Taichung Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3491,
    "name": "Tainan Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3492,
    "name": "Tainan Shih",
    "countryCode": 214
  },
  {
    "stateCode": 3493,
    "name": "Taipei Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3494,
    "name": "Taipei Shih / Taipei Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3495,
    "name": "Taitung",
    "countryCode": 214
  },
  {
    "stateCode": 3496,
    "name": "Taoyuan",
    "countryCode": 214
  },
  {
    "stateCode": 3497,
    "name": "Yilan",
    "countryCode": 214
  },
  {
    "stateCode": 3498,
    "name": "Yun-Lin Hsien",
    "countryCode": 214
  },
  {
    "stateCode": 3499,
    "name": "Yunlin",
    "countryCode": 214
  },
  {
    "stateCode": 3500,
    "name": "Dushanbe",
    "countryCode": 215
  },
  {
    "stateCode": 3501,
    "name": "Gorno-Badakhshan",
    "countryCode": 215
  },
  {
    "stateCode": 3502,
    "name": "Karotegin",
    "countryCode": 215
  },
  {
    "stateCode": 3503,
    "name": "Khatlon",
    "countryCode": 215
  },
  {
    "stateCode": 3504,
    "name": "Sughd",
    "countryCode": 215
  },
  {
    "stateCode": 3505,
    "name": "Arusha",
    "countryCode": 216
  },
  {
    "stateCode": 3506,
    "name": "Dar es Salaam",
    "countryCode": 216
  },
  {
    "stateCode": 3507,
    "name": "Dodoma",
    "countryCode": 216
  },
  {
    "stateCode": 3508,
    "name": "Iringa",
    "countryCode": 216
  },
  {
    "stateCode": 3509,
    "name": "Kagera",
    "countryCode": 216
  },
  {
    "stateCode": 3510,
    "name": "Kigoma",
    "countryCode": 216
  },
  {
    "stateCode": 3511,
    "name": "Kilimanjaro",
    "countryCode": 216
  },
  {
    "stateCode": 3512,
    "name": "Lindi",
    "countryCode": 216
  },
  {
    "stateCode": 3513,
    "name": "Mara",
    "countryCode": 216
  },
  {
    "stateCode": 3514,
    "name": "Mbeya",
    "countryCode": 216
  },
  {
    "stateCode": 3515,
    "name": "Morogoro",
    "countryCode": 216
  },
  {
    "stateCode": 3516,
    "name": "Mtwara",
    "countryCode": 216
  },
  {
    "stateCode": 3517,
    "name": "Mwanza",
    "countryCode": 216
  },
  {
    "stateCode": 3518,
    "name": "Pwani",
    "countryCode": 216
  },
  {
    "stateCode": 3519,
    "name": "Rukwa",
    "countryCode": 216
  },
  {
    "stateCode": 3520,
    "name": "Ruvuma",
    "countryCode": 216
  },
  {
    "stateCode": 3521,
    "name": "Shinyanga",
    "countryCode": 216
  },
  {
    "stateCode": 3522,
    "name": "Singida",
    "countryCode": 216
  },
  {
    "stateCode": 3523,
    "name": "Tabora",
    "countryCode": 216
  },
  {
    "stateCode": 3524,
    "name": "Tanga",
    "countryCode": 216
  },
  {
    "stateCode": 3525,
    "name": "Zanzibar and Pemba",
    "countryCode": 216
  },
  {
    "stateCode": 3526,
    "name": "Amnat Charoen",
    "countryCode": 217
  },
  {
    "stateCode": 3527,
    "name": "Ang Thong",
    "countryCode": 217
  },
  {
    "stateCode": 3528,
    "name": "Bangkok",
    "countryCode": 217
  },
  {
    "stateCode": 3529,
    "name": "Buri Ram",
    "countryCode": 217
  },
  {
    "stateCode": 3530,
    "name": "Chachoengsao",
    "countryCode": 217
  },
  {
    "stateCode": 3531,
    "name": "Chai Nat",
    "countryCode": 217
  },
  {
    "stateCode": 3532,
    "name": "Chaiyaphum",
    "countryCode": 217
  },
  {
    "stateCode": 3533,
    "name": "Changwat Chaiyaphum",
    "countryCode": 217
  },
  {
    "stateCode": 3534,
    "name": "Chanthaburi",
    "countryCode": 217
  },
  {
    "stateCode": 3535,
    "name": "Chiang Mai",
    "countryCode": 217
  },
  {
    "stateCode": 3536,
    "name": "Chiang Rai",
    "countryCode": 217
  },
  {
    "stateCode": 3537,
    "name": "Chon Buri",
    "countryCode": 217
  },
  {
    "stateCode": 3538,
    "name": "Chumphon",
    "countryCode": 217
  },
  {
    "stateCode": 3539,
    "name": "Kalasin",
    "countryCode": 217
  },
  {
    "stateCode": 3540,
    "name": "Kamphaeng Phet",
    "countryCode": 217
  },
  {
    "stateCode": 3541,
    "name": "Kanchanaburi",
    "countryCode": 217
  },
  {
    "stateCode": 3542,
    "name": "Khon Kaen",
    "countryCode": 217
  },
  {
    "stateCode": 3543,
    "name": "Krabi",
    "countryCode": 217
  },
  {
    "stateCode": 3544,
    "name": "Krung Thep",
    "countryCode": 217
  },
  {
    "stateCode": 3545,
    "name": "Lampang",
    "countryCode": 217
  },
  {
    "stateCode": 3546,
    "name": "Lamphun",
    "countryCode": 217
  },
  {
    "stateCode": 3547,
    "name": "Loei",
    "countryCode": 217
  },
  {
    "stateCode": 3548,
    "name": "Lop Buri",
    "countryCode": 217
  },
  {
    "stateCode": 3549,
    "name": "Mae Hong Son",
    "countryCode": 217
  },
  {
    "stateCode": 3550,
    "name": "Maha Sarakham",
    "countryCode": 217
  },
  {
    "stateCode": 3551,
    "name": "Mukdahan",
    "countryCode": 217
  },
  {
    "stateCode": 3552,
    "name": "Nakhon Nayok",
    "countryCode": 217
  },
  {
    "stateCode": 3553,
    "name": "Nakhon Pathom",
    "countryCode": 217
  },
  {
    "stateCode": 3554,
    "name": "Nakhon Phanom",
    "countryCode": 217
  },
  {
    "stateCode": 3555,
    "name": "Nakhon Ratchasima",
    "countryCode": 217
  },
  {
    "stateCode": 3556,
    "name": "Nakhon Sawan",
    "countryCode": 217
  },
  {
    "stateCode": 3557,
    "name": "Nakhon Si Thammarat",
    "countryCode": 217
  },
  {
    "stateCode": 3558,
    "name": "Nan",
    "countryCode": 217
  },
  {
    "stateCode": 3559,
    "name": "Narathiwat",
    "countryCode": 217
  },
  {
    "stateCode": 3560,
    "name": "Nong Bua Lam Phu",
    "countryCode": 217
  },
  {
    "stateCode": 3561,
    "name": "Nong Khai",
    "countryCode": 217
  },
  {
    "stateCode": 3562,
    "name": "Nonthaburi",
    "countryCode": 217
  },
  {
    "stateCode": 3563,
    "name": "Pathum Thani",
    "countryCode": 217
  },
  {
    "stateCode": 3564,
    "name": "Pattani",
    "countryCode": 217
  },
  {
    "stateCode": 3565,
    "name": "Phangnga",
    "countryCode": 217
  },
  {
    "stateCode": 3566,
    "name": "Phatthalung",
    "countryCode": 217
  },
  {
    "stateCode": 3567,
    "name": "Phayao",
    "countryCode": 217
  },
  {
    "stateCode": 3568,
    "name": "Phetchabun",
    "countryCode": 217
  },
  {
    "stateCode": 3569,
    "name": "Phetchaburi",
    "countryCode": 217
  },
  {
    "stateCode": 3570,
    "name": "Phichit",
    "countryCode": 217
  },
  {
    "stateCode": 3571,
    "name": "Phitsanulok",
    "countryCode": 217
  },
  {
    "stateCode": 3572,
    "name": "Phra Nakhon Si Ayutthaya",
    "countryCode": 217
  },
  {
    "stateCode": 3573,
    "name": "Phrae",
    "countryCode": 217
  },
  {
    "stateCode": 3574,
    "name": "Phuket",
    "countryCode": 217
  },
  {
    "stateCode": 3575,
    "name": "Prachin Buri",
    "countryCode": 217
  },
  {
    "stateCode": 3576,
    "name": "Prachuap Khiri Khan",
    "countryCode": 217
  },
  {
    "stateCode": 3577,
    "name": "Ranong",
    "countryCode": 217
  },
  {
    "stateCode": 3578,
    "name": "Ratchaburi",
    "countryCode": 217
  },
  {
    "stateCode": 3579,
    "name": "Rayong",
    "countryCode": 217
  },
  {
    "stateCode": 3580,
    "name": "Roi Et",
    "countryCode": 217
  },
  {
    "stateCode": 3581,
    "name": "Sa Kaeo",
    "countryCode": 217
  },
  {
    "stateCode": 3582,
    "name": "Sakon Nakhon",
    "countryCode": 217
  },
  {
    "stateCode": 3583,
    "name": "Samut Prakan",
    "countryCode": 217
  },
  {
    "stateCode": 3584,
    "name": "Samut Sakhon",
    "countryCode": 217
  },
  {
    "stateCode": 3585,
    "name": "Samut Songkhran",
    "countryCode": 217
  },
  {
    "stateCode": 3586,
    "name": "Saraburi",
    "countryCode": 217
  },
  {
    "stateCode": 3587,
    "name": "Satun",
    "countryCode": 217
  },
  {
    "stateCode": 3588,
    "name": "Si Sa Ket",
    "countryCode": 217
  },
  {
    "stateCode": 3589,
    "name": "Sing Buri",
    "countryCode": 217
  },
  {
    "stateCode": 3590,
    "name": "Songkhla",
    "countryCode": 217
  },
  {
    "stateCode": 3591,
    "name": "Sukhothai",
    "countryCode": 217
  },
  {
    "stateCode": 3592,
    "name": "Suphan Buri",
    "countryCode": 217
  },
  {
    "stateCode": 3593,
    "name": "Surat Thani",
    "countryCode": 217
  },
  {
    "stateCode": 3594,
    "name": "Surin",
    "countryCode": 217
  },
  {
    "stateCode": 3595,
    "name": "Tak",
    "countryCode": 217
  },
  {
    "stateCode": 3596,
    "name": "Trang",
    "countryCode": 217
  },
  {
    "stateCode": 3597,
    "name": "Trat",
    "countryCode": 217
  },
  {
    "stateCode": 3598,
    "name": "Ubon Ratchathani",
    "countryCode": 217
  },
  {
    "stateCode": 3599,
    "name": "Udon Thani",
    "countryCode": 217
  },
  {
    "stateCode": 3600,
    "name": "Uthai Thani",
    "countryCode": 217
  },
  {
    "stateCode": 3601,
    "name": "Uttaradit",
    "countryCode": 217
  },
  {
    "stateCode": 3602,
    "name": "Yala",
    "countryCode": 217
  },
  {
    "stateCode": 3603,
    "name": "Yasothon",
    "countryCode": 217
  },
  {
    "stateCode": 3604,
    "name": "Centre",
    "countryCode": 218
  },
  {
    "stateCode": 3605,
    "name": "Kara",
    "countryCode": 218
  },
  {
    "stateCode": 3606,
    "name": "Maritime",
    "countryCode": 218
  },
  {
    "stateCode": 3607,
    "name": "Plateaux",
    "countryCode": 218
  },
  {
    "stateCode": 3608,
    "name": "Savanes",
    "countryCode": 218
  },
  {
    "stateCode": 3609,
    "name": "Atafu",
    "countryCode": 219
  },
  {
    "stateCode": 3610,
    "name": "Fakaofo",
    "countryCode": 219
  },
  {
    "stateCode": 3611,
    "name": "Nukunonu",
    "countryCode": 219
  },
  {
    "stateCode": 3612,
    "name": "Eua",
    "countryCode": 220
  },
  {
    "stateCode": 3613,
    "name": "Ha\\apai, 220"
  },
  {
    "stateCode": 3614,
    "name": "Niuas",
    "countryCode": 220
  },
  {
    "stateCode": 3615,
    "name": "Tongatapu",
    "countryCode": 220
  },
  {
    "stateCode": 3616,
    "name": "Vava\\u, 220"
  },
  {
    "stateCode": 3617,
    "name": "Arima-Tunapuna-Piarco",
    "countryCode": 221
  },
  {
    "stateCode": 3618,
    "name": "Caroni",
    "countryCode": 221
  },
  {
    "stateCode": 3619,
    "name": "Chaguanas",
    "countryCode": 221
  },
  {
    "stateCode": 3620,
    "name": "Couva-Tabaquite-Talparo",
    "countryCode": 221
  },
  {
    "stateCode": 3621,
    "name": "Diego Martin",
    "countryCode": 221
  },
  {
    "stateCode": 3622,
    "name": "Glencoe",
    "countryCode": 221
  },
  {
    "stateCode": 3623,
    "name": "Penal Debe",
    "countryCode": 221
  },
  {
    "stateCode": 3624,
    "name": "Point Fortin",
    "countryCode": 221
  },
  {
    "stateCode": 3625,
    "name": "Port of Spain",
    "countryCode": 221
  },
  {
    "stateCode": 3626,
    "name": "Princes Town",
    "countryCode": 221
  },
  {
    "stateCode": 3627,
    "name": "Saint George",
    "countryCode": 221
  },
  {
    "stateCode": 3628,
    "name": "San Fernando",
    "countryCode": 221
  },
  {
    "stateCode": 3629,
    "name": "San Juan",
    "countryCode": 221
  },
  {
    "stateCode": 3630,
    "name": "Sangre Grande",
    "countryCode": 221
  },
  {
    "stateCode": 3631,
    "name": "Siparia",
    "countryCode": 221
  },
  {
    "stateCode": 3632,
    "name": "Tobago",
    "countryCode": 221
  },
  {
    "stateCode": 3633,
    "name": "Aryanah",
    "countryCode": 222
  },
  {
    "stateCode": 3634,
    "name": "Bajah",
    "countryCode": 222
  },
  {
    "stateCode": 3635,
    "name": "Bin \\Arus, 222"
  },
  {
    "stateCode": 3636,
    "name": "Binzart",
    "countryCode": 222
  },
  {
    "stateCode": 3637,
    "name": "Gouvernorat de Ariana",
    "countryCode": 222
  },
  {
    "stateCode": 3638,
    "name": "Gouvernorat de Nabeul",
    "countryCode": 222
  },
  {
    "stateCode": 3639,
    "name": "Gouvernorat de Sousse",
    "countryCode": 222
  },
  {
    "stateCode": 3640,
    "name": "Hammamet Yasmine",
    "countryCode": 222
  },
  {
    "stateCode": 3641,
    "name": "Jundubah",
    "countryCode": 222
  },
  {
    "stateCode": 3642,
    "name": "Madaniyin",
    "countryCode": 222
  },
  {
    "stateCode": 3643,
    "name": "Manubah",
    "countryCode": 222
  },
  {
    "stateCode": 3644,
    "name": "Monastir",
    "countryCode": 222
  },
  {
    "stateCode": 3645,
    "name": "Nabul",
    "countryCode": 222
  },
  {
    "stateCode": 3646,
    "name": "Qabis",
    "countryCode": 222
  },
  {
    "stateCode": 3647,
    "name": "Qafsah",
    "countryCode": 222
  },
  {
    "stateCode": 3648,
    "name": "Qibili",
    "countryCode": 222
  },
  {
    "stateCode": 3649,
    "name": "Safaqis",
    "countryCode": 222
  },
  {
    "stateCode": 3650,
    "name": "Sfax",
    "countryCode": 222
  },
  {
    "stateCode": 3651,
    "name": "Sidi Bu Zayd",
    "countryCode": 222
  },
  {
    "stateCode": 3652,
    "name": "Silyanah",
    "countryCode": 222
  },
  {
    "stateCode": 3653,
    "name": "Susah",
    "countryCode": 222
  },
  {
    "stateCode": 3654,
    "name": "Tatawin",
    "countryCode": 222
  },
  {
    "stateCode": 3655,
    "name": "Tawzar",
    "countryCode": 222
  },
  {
    "stateCode": 3656,
    "name": "Tunis",
    "countryCode": 222
  },
  {
    "stateCode": 3657,
    "name": "Zaghwan",
    "countryCode": 222
  },
  {
    "stateCode": 3658,
    "name": "al-Kaf",
    "countryCode": 222
  },
  {
    "stateCode": 3659,
    "name": "al-Mahdiyah",
    "countryCode": 222
  },
  {
    "stateCode": 3660,
    "name": "al-Munastir",
    "countryCode": 222
  },
  {
    "stateCode": 3661,
    "name": "al-Qasrayn",
    "countryCode": 222
  },
  {
    "stateCode": 3662,
    "name": "al-Qayrawan",
    "countryCode": 222
  },
  {
    "stateCode": 3663,
    "name": "Adana",
    "countryCode": 223
  },
  {
    "stateCode": 3664,
    "name": "Adiyaman",
    "countryCode": 223
  },
  {
    "stateCode": 3665,
    "name": "Afyon",
    "countryCode": 223
  },
  {
    "stateCode": 3666,
    "name": "Agri",
    "countryCode": 223
  },
  {
    "stateCode": 3667,
    "name": "Aksaray",
    "countryCode": 223
  },
  {
    "stateCode": 3668,
    "name": "Amasya",
    "countryCode": 223
  },
  {
    "stateCode": 3669,
    "name": "Ankara",
    "countryCode": 223
  },
  {
    "stateCode": 3670,
    "name": "Antalya",
    "countryCode": 223
  },
  {
    "stateCode": 3671,
    "name": "Ardahan",
    "countryCode": 223
  },
  {
    "stateCode": 3672,
    "name": "Artvin",
    "countryCode": 223
  },
  {
    "stateCode": 3673,
    "name": "Aydin",
    "countryCode": 223
  },
  {
    "stateCode": 3674,
    "name": "Balikesir",
    "countryCode": 223
  },
  {
    "stateCode": 3675,
    "name": "Bartin",
    "countryCode": 223
  },
  {
    "stateCode": 3676,
    "name": "Batman",
    "countryCode": 223
  },
  {
    "stateCode": 3677,
    "name": "Bayburt",
    "countryCode": 223
  },
  {
    "stateCode": 3678,
    "name": "Bilecik",
    "countryCode": 223
  },
  {
    "stateCode": 3679,
    "name": "Bingol",
    "countryCode": 223
  },
  {
    "stateCode": 3680,
    "name": "Bitlis",
    "countryCode": 223
  },
  {
    "stateCode": 3681,
    "name": "Bolu",
    "countryCode": 223
  },
  {
    "stateCode": 3682,
    "name": "Burdur",
    "countryCode": 223
  },
  {
    "stateCode": 3683,
    "name": "Bursa",
    "countryCode": 223
  },
  {
    "stateCode": 3684,
    "name": "Canakkale",
    "countryCode": 223
  },
  {
    "stateCode": 3685,
    "name": "Cankiri",
    "countryCode": 223
  },
  {
    "stateCode": 3686,
    "name": "Corum",
    "countryCode": 223
  },
  {
    "stateCode": 3687,
    "name": "Denizli",
    "countryCode": 223
  },
  {
    "stateCode": 3688,
    "name": "Diyarbakir",
    "countryCode": 223
  },
  {
    "stateCode": 3689,
    "name": "Duzce",
    "countryCode": 223
  },
  {
    "stateCode": 3690,
    "name": "Edirne",
    "countryCode": 223
  },
  {
    "stateCode": 3691,
    "name": "Elazig",
    "countryCode": 223
  },
  {
    "stateCode": 3692,
    "name": "Erzincan",
    "countryCode": 223
  },
  {
    "stateCode": 3693,
    "name": "Erzurum",
    "countryCode": 223
  },
  {
    "stateCode": 3694,
    "name": "Eskisehir",
    "countryCode": 223
  },
  {
    "stateCode": 3695,
    "name": "Gaziantep",
    "countryCode": 223
  },
  {
    "stateCode": 3696,
    "name": "Giresun",
    "countryCode": 223
  },
  {
    "stateCode": 3697,
    "name": "Gumushane",
    "countryCode": 223
  },
  {
    "stateCode": 3698,
    "name": "Hakkari",
    "countryCode": 223
  },
  {
    "stateCode": 3699,
    "name": "Hatay",
    "countryCode": 223
  },
  {
    "stateCode": 3700,
    "name": "Icel",
    "countryCode": 223
  },
  {
    "stateCode": 3701,
    "name": "Igdir",
    "countryCode": 223
  },
  {
    "stateCode": 3702,
    "name": "Isparta",
    "countryCode": 223
  },
  {
    "stateCode": 3703,
    "name": "Istanbul",
    "countryCode": 223
  },
  {
    "stateCode": 3704,
    "name": "Izmir",
    "countryCode": 223
  },
  {
    "stateCode": 3705,
    "name": "Kahramanmaras",
    "countryCode": 223
  },
  {
    "stateCode": 3706,
    "name": "Karabuk",
    "countryCode": 223
  },
  {
    "stateCode": 3707,
    "name": "Karaman",
    "countryCode": 223
  },
  {
    "stateCode": 3708,
    "name": "Kars",
    "countryCode": 223
  },
  {
    "stateCode": 3709,
    "name": "Karsiyaka",
    "countryCode": 223
  },
  {
    "stateCode": 3710,
    "name": "Kastamonu",
    "countryCode": 223
  },
  {
    "stateCode": 3711,
    "name": "Kayseri",
    "countryCode": 223
  },
  {
    "stateCode": 3712,
    "name": "Kilis",
    "countryCode": 223
  },
  {
    "stateCode": 3713,
    "name": "Kirikkale",
    "countryCode": 223
  },
  {
    "stateCode": 3714,
    "name": "Kirklareli",
    "countryCode": 223
  },
  {
    "stateCode": 3715,
    "name": "Kirsehir",
    "countryCode": 223
  },
  {
    "stateCode": 3716,
    "name": "Kocaeli",
    "countryCode": 223
  },
  {
    "stateCode": 3717,
    "name": "Konya",
    "countryCode": 223
  },
  {
    "stateCode": 3718,
    "name": "Kutahya",
    "countryCode": 223
  },
  {
    "stateCode": 3719,
    "name": "Lefkosa",
    "countryCode": 223
  },
  {
    "stateCode": 3720,
    "name": "Malatya",
    "countryCode": 223
  },
  {
    "stateCode": 3721,
    "name": "Manisa",
    "countryCode": 223
  },
  {
    "stateCode": 3722,
    "name": "Mardin",
    "countryCode": 223
  },
  {
    "stateCode": 3723,
    "name": "Mugla",
    "countryCode": 223
  },
  {
    "stateCode": 3724,
    "name": "Mus",
    "countryCode": 223
  },
  {
    "stateCode": 3725,
    "name": "Nevsehir",
    "countryCode": 223
  },
  {
    "stateCode": 3726,
    "name": "Nigde",
    "countryCode": 223
  },
  {
    "stateCode": 3727,
    "name": "Ordu",
    "countryCode": 223
  },
  {
    "stateCode": 3728,
    "name": "Osmaniye",
    "countryCode": 223
  },
  {
    "stateCode": 3729,
    "name": "Rize",
    "countryCode": 223
  },
  {
    "stateCode": 3730,
    "name": "Sakarya",
    "countryCode": 223
  },
  {
    "stateCode": 3731,
    "name": "Samsun",
    "countryCode": 223
  },
  {
    "stateCode": 3732,
    "name": "Sanliurfa",
    "countryCode": 223
  },
  {
    "stateCode": 3733,
    "name": "Siirt",
    "countryCode": 223
  },
  {
    "stateCode": 3734,
    "name": "Sinop",
    "countryCode": 223
  },
  {
    "stateCode": 3735,
    "name": "Sirnak",
    "countryCode": 223
  },
  {
    "stateCode": 3736,
    "name": "Sivas",
    "countryCode": 223
  },
  {
    "stateCode": 3737,
    "name": "Tekirdag",
    "countryCode": 223
  },
  {
    "stateCode": 3738,
    "name": "Tokat",
    "countryCode": 223
  },
  {
    "stateCode": 3739,
    "name": "Trabzon",
    "countryCode": 223
  },
  {
    "stateCode": 3740,
    "name": "Tunceli",
    "countryCode": 223
  },
  {
    "stateCode": 3741,
    "name": "Usak",
    "countryCode": 223
  },
  {
    "stateCode": 3742,
    "name": "Van",
    "countryCode": 223
  },
  {
    "stateCode": 3743,
    "name": "Yalova",
    "countryCode": 223
  },
  {
    "stateCode": 3744,
    "name": "Yozgat",
    "countryCode": 223
  },
  {
    "stateCode": 3745,
    "name": "Zonguldak",
    "countryCode": 223
  },
  {
    "stateCode": 3746,
    "name": "Ahal",
    "countryCode": 224
  },
  {
    "stateCode": 3747,
    "name": "Asgabat",
    "countryCode": 224
  },
  {
    "stateCode": 3748,
    "name": "Balkan",
    "countryCode": 224
  },
  {
    "stateCode": 3749,
    "name": "Dasoguz",
    "countryCode": 224
  },
  {
    "stateCode": 3750,
    "name": "Lebap",
    "countryCode": 224
  },
  {
    "stateCode": 3751,
    "name": "Mari",
    "countryCode": 224
  },
  {
    "stateCode": 3752,
    "name": "Grand Turk",
    "countryCode": 225
  },
  {
    "stateCode": 3753,
    "name": "South Caicos and East Caicos",
    "countryCode": 225
  },
  {
    "stateCode": 3754,
    "name": "Funafuti",
    "countryCode": 226
  },
  {
    "stateCode": 3755,
    "name": "Nanumanga",
    "countryCode": 226
  },
  {
    "stateCode": 3756,
    "name": "Nanumea",
    "countryCode": 226
  },
  {
    "stateCode": 3757,
    "name": "Niutao",
    "countryCode": 226
  },
  {
    "stateCode": 3758,
    "name": "Nui",
    "countryCode": 226
  },
  {
    "stateCode": 3759,
    "name": "Nukufetau",
    "countryCode": 226
  },
  {
    "stateCode": 3760,
    "name": "Nukulaelae",
    "countryCode": 226
  },
  {
    "stateCode": 3761,
    "name": "Vaitupu",
    "countryCode": 226
  },
  {
    "stateCode": 3762,
    "name": "Central",
    "countryCode": 227
  },
  {
    "stateCode": 3763,
    "name": "Eastern",
    "countryCode": 227
  },
  {
    "stateCode": 3764,
    "name": "Northern",
    "countryCode": 227
  },
  {
    "stateCode": 3765,
    "name": "Western",
    "countryCode": 227
  },
  {
    "stateCode": 3766,
    "name": "Cherkas\\ka, 228"
  },
  {
    "stateCode": 3767,
    "name": "Chernihivs\\ka, 228"
  },
  {
    "stateCode": 3768,
    "name": "Chernivets\\ka, 228"
  },
  {
    "stateCode": 3769,
    "name": "Crimea",
    "countryCode": 228
  },
  {
    "stateCode": 3770,
    "name": "Dnipropetrovska",
    "countryCode": 228
  },
  {
    "stateCode": 3771,
    "name": "Donets\\ka, 228"
  },
  {
    "stateCode": 3772,
    "name": "Ivano-Frankivs\\ka, 228"
  },
  {
    "stateCode": 3773,
    "name": "Kharkiv",
    "countryCode": 228
  },
  {
    "stateCode": 3774,
    "name": "Kharkov",
    "countryCode": 228
  },
  {
    "stateCode": 3775,
    "name": "Khersonska",
    "countryCode": 228
  },
  {
    "stateCode": 3776,
    "name": "Khmel\\nyts\\ka",
    "countryCode": 228
  },
  {
    "stateCode": 3777,
    "name": "Kirovohrad",
    "countryCode": 228
  },
  {
    "stateCode": 3778,
    "name": "Krym",
    "countryCode": 228
  },
  {
    "stateCode": 3779,
    "name": "Kyyiv",
    "countryCode": 228
  },
  {
    "stateCode": 3780,
    "name": "Kyyivs\\ka, 228"
  },
  {
    "stateCode": 3781,
    "name": "L\\vivs\\ka",
    "countryCode": 228
  },
  {
    "stateCode": 3782,
    "name": "Luhans\\ka, 228"
  },
  {
    "stateCode": 3783,
    "name": "Mykolayivs\\ka, 228"
  },
  {
    "stateCode": 3784,
    "name": "Odes\\ka, 228"
  },
  {
    "stateCode": 3785,
    "name": "Odessa",
    "countryCode": 228
  },
  {
    "stateCode": 3786,
    "name": "Poltavs\\ka, 228"
  },
  {
    "stateCode": 3787,
    "name": "Rivnens\\ka, 228"
  },
  {
    "stateCode": 3788,
    "name": "Sevastopol\\', 228"
  },
  {
    "stateCode": 3789,
    "name": "Sums\\ka, 228"
  },
  {
    "stateCode": 3790,
    "name": "Ternopil\\s\\ka",
    "countryCode": 228
  },
  {
    "stateCode": 3791,
    "name": "Volyns\\ka, 228"
  },
  {
    "stateCode": 3792,
    "name": "Vynnyts\\ka, 228"
  },
  {
    "stateCode": 3793,
    "name": "Zakarpats\\ka, 228"
  },
  {
    "stateCode": 3794,
    "name": "Zaporizhia",
    "countryCode": 228
  },
  {
    "stateCode": 3795,
    "name": "Zhytomyrs\\ka, 228"
  },
  {
    "stateCode": 3796,
    "name": "Abu Zabi",
    "countryCode": 229
  },
  {
    "stateCode": 3797,
    "name": "Ajman",
    "countryCode": 229
  },
  {
    "stateCode": 3798,
    "name": "Dubai",
    "countryCode": 229
  },
  {
    "stateCode": 3799,
    "name": "Ras al-Khaymah",
    "countryCode": 229
  },
  {
    "stateCode": 3800,
    "name": "Sharjah",
    "countryCode": 229
  },
  {
    "stateCode": 3801,
    "name": "Sharjha",
    "countryCode": 229
  },
  {
    "stateCode": 3802,
    "name": "Umm al Qaywayn",
    "countryCode": 229
  },
  {
    "stateCode": 3803,
    "name": "al-Fujayrah",
    "countryCode": 229
  },
  {
    "stateCode": 3804,
    "name": "ash-Shariqah",
    "countryCode": 229
  },
  {
    "stateCode": 3805,
    "name": "Aberdeen",
    "countryCode": 230
  },
  {
    "stateCode": 3806,
    "name": "Aberdeenshire",
    "countryCode": 230
  },
  {
    "stateCode": 3807,
    "name": "Argyll",
    "countryCode": 230
  },
  {
    "stateCode": 3808,
    "name": "Armagh",
    "countryCode": 230
  },
  {
    "stateCode": 3809,
    "name": "Bedfordshire",
    "countryCode": 230
  },
  {
    "stateCode": 3810,
    "name": "Belfast",
    "countryCode": 230
  },
  {
    "stateCode": 3811,
    "name": "Berkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3812,
    "name": "Birmingham",
    "countryCode": 230
  },
  {
    "stateCode": 3813,
    "name": "Brechin",
    "countryCode": 230
  },
  {
    "stateCode": 3814,
    "name": "Bridgnorth",
    "countryCode": 230
  },
  {
    "stateCode": 3815,
    "name": "Bristol",
    "countryCode": 230
  },
  {
    "stateCode": 3816,
    "name": "Buckinghamshire",
    "countryCode": 230
  },
  {
    "stateCode": 3817,
    "name": "Cambridge",
    "countryCode": 230
  },
  {
    "stateCode": 3818,
    "name": "Cambridgeshire",
    "countryCode": 230
  },
  {
    "stateCode": 3819,
    "name": "Channel Islands",
    "countryCode": 230
  },
  {
    "stateCode": 3820,
    "name": "Cheshire",
    "countryCode": 230
  },
  {
    "stateCode": 3821,
    "name": "Cleveland",
    "countryCode": 230
  },
  {
    "stateCode": 3822,
    "name": "Co Fermanagh",
    "countryCode": 230
  },
  {
    "stateCode": 3823,
    "name": "Conwy",
    "countryCode": 230
  },
  {
    "stateCode": 3824,
    "name": "Cornwall",
    "countryCode": 230
  },
  {
    "stateCode": 3825,
    "name": "Coventry",
    "countryCode": 230
  },
  {
    "stateCode": 3826,
    "name": "Craven Arms",
    "countryCode": 230
  },
  {
    "stateCode": 3827,
    "name": "Cumbria",
    "countryCode": 230
  },
  {
    "stateCode": 3828,
    "name": "Denbighshire",
    "countryCode": 230
  },
  {
    "stateCode": 3829,
    "name": "Derby",
    "countryCode": 230
  },
  {
    "stateCode": 3830,
    "name": "Derbyshire",
    "countryCode": 230
  },
  {
    "stateCode": 3831,
    "name": "Devon",
    "countryCode": 230
  },
  {
    "stateCode": 3832,
    "name": "Dial Code Dungannon",
    "countryCode": 230
  },
  {
    "stateCode": 3833,
    "name": "Didcot",
    "countryCode": 230
  },
  {
    "stateCode": 3834,
    "name": "Dorset",
    "countryCode": 230
  },
  {
    "stateCode": 3835,
    "name": "Dunbartonshire",
    "countryCode": 230
  },
  {
    "stateCode": 3836,
    "name": "Durham",
    "countryCode": 230
  },
  {
    "stateCode": 3837,
    "name": "East Dunbartonshire",
    "countryCode": 230
  },
  {
    "stateCode": 3838,
    "name": "East Lothian",
    "countryCode": 230
  },
  {
    "stateCode": 3839,
    "name": "East Midlands",
    "countryCode": 230
  },
  {
    "stateCode": 3840,
    "name": "East Sussex",
    "countryCode": 230
  },
  {
    "stateCode": 3841,
    "name": "East Yorkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3842,
    "name": "England",
    "countryCode": 230
  },
  {
    "stateCode": 3843,
    "name": "Essex",
    "countryCode": 230
  },
  {
    "stateCode": 3844,
    "name": "Fermanagh",
    "countryCode": 230
  },
  {
    "stateCode": 3845,
    "name": "Fife",
    "countryCode": 230
  },
  {
    "stateCode": 3846,
    "name": "Flintshire",
    "countryCode": 230
  },
  {
    "stateCode": 3847,
    "name": "Fulham",
    "countryCode": 230
  },
  {
    "stateCode": 3848,
    "name": "Gainsborough",
    "countryCode": 230
  },
  {
    "stateCode": 3849,
    "name": "Glocestershire",
    "countryCode": 230
  },
  {
    "stateCode": 3850,
    "name": "Gwent",
    "countryCode": 230
  },
  {
    "stateCode": 3851,
    "name": "Hampshire",
    "countryCode": 230
  },
  {
    "stateCode": 3852,
    "name": "Hants",
    "countryCode": 230
  },
  {
    "stateCode": 3853,
    "name": "Herefordshire",
    "countryCode": 230
  },
  {
    "stateCode": 3854,
    "name": "Hertfordshire",
    "countryCode": 230
  },
  {
    "stateCode": 3855,
    "name": "Ireland",
    "countryCode": 230
  },
  {
    "stateCode": 3856,
    "name": "Isle Of Man",
    "countryCode": 230
  },
  {
    "stateCode": 3857,
    "name": "Isle of Wight",
    "countryCode": 230
  },
  {
    "stateCode": 3858,
    "name": "Kenford",
    "countryCode": 230
  },
  {
    "stateCode": 3859,
    "name": "Kent",
    "countryCode": 230
  },
  {
    "stateCode": 3860,
    "name": "Kilmarnock",
    "countryCode": 230
  },
  {
    "stateCode": 3861,
    "name": "Lanarkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3862,
    "name": "Lancashire",
    "countryCode": 230
  },
  {
    "stateCode": 3863,
    "name": "Leicestershire",
    "countryCode": 230
  },
  {
    "stateCode": 3864,
    "name": "Lincolnshire",
    "countryCode": 230
  },
  {
    "stateCode": 3865,
    "name": "Llanymynech",
    "countryCode": 230
  },
  {
    "stateCode": 3866,
    "name": "London",
    "countryCode": 230
  },
  {
    "stateCode": 3867,
    "name": "Ludlow",
    "countryCode": 230
  },
  {
    "stateCode": 3868,
    "name": "Manchester",
    "countryCode": 230
  },
  {
    "stateCode": 3869,
    "name": "Mayfair",
    "countryCode": 230
  },
  {
    "stateCode": 3870,
    "name": "Merseyside",
    "countryCode": 230
  },
  {
    "stateCode": 3871,
    "name": "Mid Glamorgan",
    "countryCode": 230
  },
  {
    "stateCode": 3872,
    "name": "Middlesex",
    "countryCode": 230
  },
  {
    "stateCode": 3873,
    "name": "Mildenhall",
    "countryCode": 230
  },
  {
    "stateCode": 3874,
    "name": "Monmouthshire",
    "countryCode": 230
  },
  {
    "stateCode": 3875,
    "name": "Newton Stewart",
    "countryCode": 230
  },
  {
    "stateCode": 3876,
    "name": "Norfolk",
    "countryCode": 230
  },
  {
    "stateCode": 3877,
    "name": "North Humberside",
    "countryCode": 230
  },
  {
    "stateCode": 3878,
    "name": "North Yorkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3879,
    "name": "Northamptonshire",
    "countryCode": 230
  },
  {
    "stateCode": 3880,
    "name": "Northants",
    "countryCode": 230
  },
  {
    "stateCode": 3881,
    "name": "Northern Ireland",
    "countryCode": 230
  },
  {
    "stateCode": 3882,
    "name": "Northumberland",
    "countryCode": 230
  },
  {
    "stateCode": 3883,
    "name": "Nottinghamshire",
    "countryCode": 230
  },
  {
    "stateCode": 3884,
    "name": "Oxford",
    "countryCode": 230
  },
  {
    "stateCode": 3885,
    "name": "Powys",
    "countryCode": 230
  },
  {
    "stateCode": 3886,
    "name": "Roos-shire",
    "countryCode": 230
  },
  {
    "stateCode": 3887,
    "name": "SUSSEX",
    "countryCode": 230
  },
  {
    "stateCode": 3888,
    "name": "Sark",
    "countryCode": 230
  },
  {
    "stateCode": 3889,
    "name": "Scotland",
    "countryCode": 230
  },
  {
    "stateCode": 3890,
    "name": "Scottish Borders",
    "countryCode": 230
  },
  {
    "stateCode": 3891,
    "name": "Shropshire",
    "countryCode": 230
  },
  {
    "stateCode": 3892,
    "name": "Somerset",
    "countryCode": 230
  },
  {
    "stateCode": 3893,
    "name": "South Glamorgan",
    "countryCode": 230
  },
  {
    "stateCode": 3894,
    "name": "South Wales",
    "countryCode": 230
  },
  {
    "stateCode": 3895,
    "name": "South Yorkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3896,
    "name": "Southwell",
    "countryCode": 230
  },
  {
    "stateCode": 3897,
    "name": "Staffordshire",
    "countryCode": 230
  },
  {
    "stateCode": 3898,
    "name": "Strabane",
    "countryCode": 230
  },
  {
    "stateCode": 3899,
    "name": "Suffolk",
    "countryCode": 230
  },
  {
    "stateCode": 3900,
    "name": "Surrey",
    "countryCode": 230
  },
  {
    "stateCode": 3901,
    "name": "Sussex",
    "countryCode": 230
  },
  {
    "stateCode": 3902,
    "name": "Twickenham",
    "countryCode": 230
  },
  {
    "stateCode": 3903,
    "name": "Tyne and Wear",
    "countryCode": 230
  },
  {
    "stateCode": 3904,
    "name": "Tyrone",
    "countryCode": 230
  },
  {
    "stateCode": 3905,
    "name": "Utah",
    "countryCode": 230
  },
  {
    "stateCode": 3906,
    "name": "Wales",
    "countryCode": 230
  },
  {
    "stateCode": 3907,
    "name": "Warwickshire",
    "countryCode": 230
  },
  {
    "stateCode": 3908,
    "name": "West Lothian",
    "countryCode": 230
  },
  {
    "stateCode": 3909,
    "name": "West Midlands",
    "countryCode": 230
  },
  {
    "stateCode": 3910,
    "name": "West Sussex",
    "countryCode": 230
  },
  {
    "stateCode": 3911,
    "name": "West Yorkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3912,
    "name": "Whissendine",
    "countryCode": 230
  },
  {
    "stateCode": 3913,
    "name": "Wiltshire",
    "countryCode": 230
  },
  {
    "stateCode": 3914,
    "name": "Wokingham",
    "countryCode": 230
  },
  {
    "stateCode": 3915,
    "name": "Worcestershire",
    "countryCode": 230
  },
  {
    "stateCode": 3916,
    "name": "Wrexham",
    "countryCode": 230
  },
  {
    "stateCode": 3917,
    "name": "Wurttemberg",
    "countryCode": 230
  },
  {
    "stateCode": 3918,
    "name": "Yorkshire",
    "countryCode": 230
  },
  {
    "stateCode": 3919,
    "name": "Alabama",
    "countryCode": 231
  },
  {
    "stateCode": 3920,
    "name": "Alaska",
    "countryCode": 231
  },
  {
    "stateCode": 3921,
    "name": "Arizona",
    "countryCode": 231
  },
  {
    "stateCode": 3922,
    "name": "Arkansas",
    "countryCode": 231
  },
  {
    "stateCode": 3923,
    "name": "Byram",
    "countryCode": 231
  },
  {
    "stateCode": 3924,
    "name": "California",
    "countryCode": 231
  },
  {
    "stateCode": 3925,
    "name": "Cokato",
    "countryCode": 231
  },
  {
    "stateCode": 3926,
    "name": "Colorado",
    "countryCode": 231
  },
  {
    "stateCode": 3927,
    "name": "Connecticut",
    "countryCode": 231
  },
  {
    "stateCode": 3928,
    "name": "Delaware",
    "countryCode": 231
  },
  {
    "stateCode": 3929,
    "name": "District of Columbia",
    "countryCode": 231
  },
  {
    "stateCode": 3930,
    "name": "Florida",
    "countryCode": 231
  },
  {
    "stateCode": 3931,
    "name": "Georgia",
    "countryCode": 231
  },
  {
    "stateCode": 3932,
    "name": "Hawaii",
    "countryCode": 231
  },
  {
    "stateCode": 3933,
    "name": "Idaho",
    "countryCode": 231
  },
  {
    "stateCode": 3934,
    "name": "Illinois",
    "countryCode": 231
  },
  {
    "stateCode": 3935,
    "name": "Indiana",
    "countryCode": 231
  },
  {
    "stateCode": 3936,
    "name": "Iowa",
    "countryCode": 231
  },
  {
    "stateCode": 3937,
    "name": "Kansas",
    "countryCode": 231
  },
  {
    "stateCode": 3938,
    "name": "Kentucky",
    "countryCode": 231
  },
  {
    "stateCode": 3939,
    "name": "Louisiana",
    "countryCode": 231
  },
  {
    "stateCode": 3940,
    "name": "Lowa",
    "countryCode": 231
  },
  {
    "stateCode": 3941,
    "name": "Maine",
    "countryCode": 231
  },
  {
    "stateCode": 3942,
    "name": "Maryland",
    "countryCode": 231
  },
  {
    "stateCode": 3943,
    "name": "Massachusetts",
    "countryCode": 231
  },
  {
    "stateCode": 3944,
    "name": "Medfield",
    "countryCode": 231
  },
  {
    "stateCode": 3945,
    "name": "Michigan",
    "countryCode": 231
  },
  {
    "stateCode": 3946,
    "name": "Minnesota",
    "countryCode": 231
  },
  {
    "stateCode": 3947,
    "name": "Mississippi",
    "countryCode": 231
  },
  {
    "stateCode": 3948,
    "name": "Missouri",
    "countryCode": 231
  },
  {
    "stateCode": 3949,
    "name": "Montana",
    "countryCode": 231
  },
  {
    "stateCode": 3950,
    "name": "Nebraska",
    "countryCode": 231
  },
  {
    "stateCode": 3951,
    "name": "Nevada",
    "countryCode": 231
  },
  {
    "stateCode": 3952,
    "name": "New Hampshire",
    "countryCode": 231
  },
  {
    "stateCode": 3953,
    "name": "New Jersey",
    "countryCode": 231
  },
  {
    "stateCode": 3954,
    "name": "New Jersy",
    "countryCode": 231
  },
  {
    "stateCode": 3955,
    "name": "New Mexico",
    "countryCode": 231
  },
  {
    "stateCode": 3956,
    "name": "New York",
    "countryCode": 231
  },
  {
    "stateCode": 3957,
    "name": "North Carolina",
    "countryCode": 231
  },
  {
    "stateCode": 3958,
    "name": "North Dakota",
    "countryCode": 231
  },
  {
    "stateCode": 3959,
    "name": "Ohio",
    "countryCode": 231
  },
  {
    "stateCode": 3960,
    "name": "Oklahoma",
    "countryCode": 231
  },
  {
    "stateCode": 3961,
    "name": "Ontario",
    "countryCode": 231
  },
  {
    "stateCode": 3962,
    "name": "Oregon",
    "countryCode": 231
  },
  {
    "stateCode": 3963,
    "name": "Pennsylvania",
    "countryCode": 231
  },
  {
    "stateCode": 3964,
    "name": "Ramey",
    "countryCode": 231
  },
  {
    "stateCode": 3965,
    "name": "Rhode Island",
    "countryCode": 231
  },
  {
    "stateCode": 3966,
    "name": "South Carolina",
    "countryCode": 231
  },
  {
    "stateCode": 3967,
    "name": "South Dakota",
    "countryCode": 231
  },
  {
    "stateCode": 3968,
    "name": "Sublimity",
    "countryCode": 231
  },
  {
    "stateCode": 3969,
    "name": "Tennessee",
    "countryCode": 231
  },
  {
    "stateCode": 3970,
    "name": "Texas",
    "countryCode": 231
  },
  {
    "stateCode": 3971,
    "name": "Trimble",
    "countryCode": 231
  },
  {
    "stateCode": 3972,
    "name": "Utah",
    "countryCode": 231
  },
  {
    "stateCode": 3973,
    "name": "Vermont",
    "countryCode": 231
  },
  {
    "stateCode": 3974,
    "name": "Virginia",
    "countryCode": 231
  },
  {
    "stateCode": 3975,
    "name": "Washington",
    "countryCode": 231
  },
  {
    "stateCode": 3976,
    "name": "West Virginia",
    "countryCode": 231
  },
  {
    "stateCode": 3977,
    "name": "Wisconsin",
    "countryCode": 231
  },
  {
    "stateCode": 3978,
    "name": "Wyoming",
    "countryCode": 231
  },
  {
    "stateCode": 3979,
    "name": "United States Minor Outlying I",
    "countryCode": 232
  },
  {
    "stateCode": 3980,
    "name": "Artigas",
    "countryCode": 233
  },
  {
    "stateCode": 3981,
    "name": "Canelones",
    "countryCode": 233
  },
  {
    "stateCode": 3982,
    "name": "Cerro Largo",
    "countryCode": 233
  },
  {
    "stateCode": 3983,
    "name": "Colonia",
    "countryCode": 233
  },
  {
    "stateCode": 3984,
    "name": "Durazno",
    "countryCode": 233
  },
  {
    "stateCode": 3985,
    "name": "FLorida",
    "countryCode": 233
  },
  {
    "stateCode": 3986,
    "name": "Flores",
    "countryCode": 233
  },
  {
    "stateCode": 3987,
    "name": "Lavalleja",
    "countryCode": 233
  },
  {
    "stateCode": 3988,
    "name": "Maldonado",
    "countryCode": 233
  },
  {
    "stateCode": 3989,
    "name": "Montevideo",
    "countryCode": 233
  },
  {
    "stateCode": 3990,
    "name": "Paysandu",
    "countryCode": 233
  },
  {
    "stateCode": 3991,
    "name": "Rio Negro",
    "countryCode": 233
  },
  {
    "stateCode": 3992,
    "name": "Rivera",
    "countryCode": 233
  },
  {
    "stateCode": 3993,
    "name": "Rocha",
    "countryCode": 233
  },
  {
    "stateCode": 3994,
    "name": "Salto",
    "countryCode": 233
  },
  {
    "stateCode": 3995,
    "name": "San Jose",
    "countryCode": 233
  },
  {
    "stateCode": 3996,
    "name": "Soriano",
    "countryCode": 233
  },
  {
    "stateCode": 3997,
    "name": "Tacuarembo",
    "countryCode": 233
  },
  {
    "stateCode": 3998,
    "name": "Treinta y Tres",
    "countryCode": 233
  },
  {
    "stateCode": 3999,
    "name": "Andijon",
    "countryCode": 234
  },
  {
    "stateCode": 4000,
    "name": "Buhoro",
    "countryCode": 234
  },
  {
    "stateCode": 4001,
    "name": "Buxoro Viloyati",
    "countryCode": 234
  },
  {
    "stateCode": 4002,
    "name": "Cizah",
    "countryCode": 234
  },
  {
    "stateCode": 4003,
    "name": "Fargona",
    "countryCode": 234
  },
  {
    "stateCode": 4004,
    "name": "Horazm",
    "countryCode": 234
  },
  {
    "stateCode": 4005,
    "name": "Kaskadar",
    "countryCode": 234
  },
  {
    "stateCode": 4006,
    "name": "Korakalpogiston",
    "countryCode": 234
  },
  {
    "stateCode": 4007,
    "name": "Namangan",
    "countryCode": 234
  },
  {
    "stateCode": 4008,
    "name": "Navoi",
    "countryCode": 234
  },
  {
    "stateCode": 4009,
    "name": "Samarkand",
    "countryCode": 234
  },
  {
    "stateCode": 4010,
    "name": "Sirdare",
    "countryCode": 234
  },
  {
    "stateCode": 4011,
    "name": "Surhondar",
    "countryCode": 234
  },
  {
    "stateCode": 4012,
    "name": "Toskent",
    "countryCode": 234
  },
  {
    "stateCode": 4013,
    "name": "Malampa",
    "countryCode": 235
  },
  {
    "stateCode": 4014,
    "name": "Penama",
    "countryCode": 235
  },
  {
    "stateCode": 4015,
    "name": "Sanma",
    "countryCode": 235
  },
  {
    "stateCode": 4016,
    "name": "Shefa",
    "countryCode": 235
  },
  {
    "stateCode": 4017,
    "name": "Tafea",
    "countryCode": 235
  },
  {
    "stateCode": 4018,
    "name": "Torba",
    "countryCode": 235
  },
  {
    "stateCode": 4019,
    "name": "Vatican City State (Holy See"
  },
  {
    "stateCode": 4020,
    "name": "Amazonas",
    "countryCode": 237
  },
  {
    "stateCode": 4021,
    "name": "Anzoategui",
    "countryCode": 237
  },
  {
    "stateCode": 4022,
    "name": "Apure",
    "countryCode": 237
  },
  {
    "stateCode": 4023,
    "name": "Aragua",
    "countryCode": 237
  },
  {
    "stateCode": 4024,
    "name": "Barinas",
    "countryCode": 237
  },
  {
    "stateCode": 4025,
    "name": "Bolivar",
    "countryCode": 237
  },
  {
    "stateCode": 4026,
    "name": "Carabobo",
    "countryCode": 237
  },
  {
    "stateCode": 4027,
    "name": "Cojedes",
    "countryCode": 237
  },
  {
    "stateCode": 4028,
    "name": "Delta Amacuro",
    "countryCode": 237
  },
  {
    "stateCode": 4029,
    "name": "Distrito Federal",
    "countryCode": 237
  },
  {
    "stateCode": 4030,
    "name": "Falcon",
    "countryCode": 237
  },
  {
    "stateCode": 4031,
    "name": "Guarico",
    "countryCode": 237
  },
  {
    "stateCode": 4032,
    "name": "Lara",
    "countryCode": 237
  },
  {
    "stateCode": 4033,
    "name": "Merida",
    "countryCode": 237
  },
  {
    "stateCode": 4034,
    "name": "Miranda",
    "countryCode": 237
  },
  {
    "stateCode": 4035,
    "name": "Monagas",
    "countryCode": 237
  },
  {
    "stateCode": 4036,
    "name": "Nueva Esparta",
    "countryCode": 237
  },
  {
    "stateCode": 4037,
    "name": "Portuguesa",
    "countryCode": 237
  },
  {
    "stateCode": 4038,
    "name": "Sucre",
    "countryCode": 237
  },
  {
    "stateCode": 4039,
    "name": "Tachira",
    "countryCode": 237
  },
  {
    "stateCode": 4040,
    "name": "Trujillo",
    "countryCode": 237
  },
  {
    "stateCode": 4041,
    "name": "Vargas",
    "countryCode": 237
  },
  {
    "stateCode": 4042,
    "name": "Yaracuy",
    "countryCode": 237
  },
  {
    "stateCode": 4043,
    "name": "Zulia",
    "countryCode": 237
  },
  {
    "stateCode": 4044,
    "name": "Bac Giang",
    "countryCode": 238
  },
  {
    "stateCode": 4045,
    "name": "Binh Dinh",
    "countryCode": 238
  },
  {
    "stateCode": 4046,
    "name": "Binh Duong",
    "countryCode": 238
  },
  {
    "stateCode": 4047,
    "name": "Da Nang",
    "countryCode": 238
  },
  {
    "stateCode": 4048,
    "name": "Dong Bang Song Cuu Long",
    "countryCode": 238
  },
  {
    "stateCode": 4049,
    "name": "Dong Bang Song Hong",
    "countryCode": 238
  },
  {
    "stateCode": 4050,
    "name": "Dong Nai",
    "countryCode": 238
  },
  {
    "stateCode": 4051,
    "name": "Dong Nam Bo",
    "countryCode": 238
  },
  {
    "stateCode": 4052,
    "name": "Duyen Hai Mien Trung",
    "countryCode": 238
  },
  {
    "stateCode": 4053,
    "name": "Hanoi",
    "countryCode": 238
  },
  {
    "stateCode": 4054,
    "name": "Hung Yen",
    "countryCode": 238
  },
  {
    "stateCode": 4055,
    "name": "Khu Bon Cu",
    "countryCode": 238
  },
  {
    "stateCode": 4056,
    "name": "Long An",
    "countryCode": 238
  },
  {
    "stateCode": 4057,
    "name": "Mien Nui Va Trung Du",
    "countryCode": 238
  },
  {
    "stateCode": 4058,
    "name": "Thai Nguyen",
    "countryCode": 238
  },
  {
    "stateCode": 4059,
    "name": "Thanh Pho Ho Chi Minh",
    "countryCode": 238
  },
  {
    "stateCode": 4060,
    "name": "Thu Do Ha Noi",
    "countryCode": 238
  },
  {
    "stateCode": 4061,
    "name": "Tinh Can Tho",
    "countryCode": 238
  },
  {
    "stateCode": 4062,
    "name": "Tinh Da Nang",
    "countryCode": 238
  },
  {
    "stateCode": 4063,
    "name": "Tinh Gia Lai",
    "countryCode": 238
  },
  {
    "stateCode": 4064,
    "name": "Anegada",
    "countryCode": 239
  },
  {
    "stateCode": 4065,
    "name": "Jost van Dyke",
    "countryCode": 239
  },
  {
    "stateCode": 4066,
    "name": "Tortola",
    "countryCode": 239
  },
  {
    "stateCode": 4067,
    "name": "Saint Croix",
    "countryCode": 240
  },
  {
    "stateCode": 4068,
    "name": "Saint John",
    "countryCode": 240
  },
  {
    "stateCode": 4069,
    "name": "Saint Thomas",
    "countryCode": 240
  },
  {
    "stateCode": 4070,
    "name": "Alo",
    "countryCode": 241
  },
  {
    "stateCode": 4071,
    "name": "Singave",
    "countryCode": 241
  },
  {
    "stateCode": 4072,
    "name": "Wallis",
    "countryCode": 241
  },
  {
    "stateCode": 4073,
    "name": "Bu Jaydur",
    "countryCode": 242
  },
  {
    "stateCode": 4074,
    "name": "Wad-adh-Dhahab",
    "countryCode": 242
  },
  {
    "stateCode": 4075,
    "name": "al-\\Ayun, 242"
  },
  {
    "stateCode": 4076,
    "name": "as-Samarah",
    "countryCode": 242
  },
  {
    "stateCode": 4077,
    "name": "\\Adan, 243"
  },
  {
    "stateCode": 4078,
    "name": "Abyan",
    "countryCode": 243
  },
  {
    "stateCode": 4079,
    "name": "Dhamar",
    "countryCode": 243
  },
  {
    "stateCode": 4080,
    "name": "Hadramaut",
    "countryCode": 243
  },
  {
    "stateCode": 4081,
    "name": "Hajjah",
    "countryCode": 243
  },
  {
    "stateCode": 4082,
    "name": "Hudaydah",
    "countryCode": 243
  },
  {
    "stateCode": 4083,
    "name": "Ibb",
    "countryCode": 243
  },
  {
    "stateCode": 4084,
    "name": "Lahij",
    "countryCode": 243
  },
  {
    "stateCode": 4085,
    "name": "Ma\\rib, 243"
  },
  {
    "stateCode": 4086,
    "name": "Madinat San\\a, 243"
  },
  {
    "stateCode": 4087,
    "name": "Sa\\dah, 243"
  },
  {
    "stateCode": 4088,
    "name": "Sana",
    "countryCode": 243
  },
  {
    "stateCode": 4089,
    "name": "Shabwah",
    "countryCode": 243
  },
  {
    "stateCode": 4090,
    "name": "Ta\\izz, 243"
  },
  {
    "stateCode": 4091,
    "name": "al-Bayda",
    "countryCode": 243
  },
  {
    "stateCode": 4092,
    "name": "al-Hudaydah",
    "countryCode": 243
  },
  {
    "stateCode": 4093,
    "name": "al-Jawf",
    "countryCode": 243
  },
  {
    "stateCode": 4094,
    "name": "al-Mahrah",
    "countryCode": 243
  },
  {
    "stateCode": 4095,
    "name": "al-Mahwit",
    "countryCode": 243
  },
  {
    "stateCode": 4096,
    "name": "Central Serbia",
    "countryCode": 244
  },
  {
    "stateCode": 4097,
    "name": "Kosovo and Metohija",
    "countryCode": 244
  },
  {
    "stateCode": 4098,
    "name": "Montenegro",
    "countryCode": 244
  },
  {
    "stateCode": 4099,
    "name": "Republic of Serbia",
    "countryCode": 244
  },
  {
    "stateCode": 4100,
    "name": "Serbia",
    "countryCode": 244
  },
  {
    "stateCode": 4101,
    "name": "Vojvodina",
    "countryCode": 244
  },
  {
    "stateCode": 4102,
    "name": "Central",
    "countryCode": 245
  },
  {
    "stateCode": 4103,
    "name": "Copperbelt",
    "countryCode": 245
  },
  {
    "stateCode": 4104,
    "name": "Eastern",
    "countryCode": 245
  },
  {
    "stateCode": 4105,
    "name": "Luapala",
    "countryCode": 245
  },
  {
    "stateCode": 4106,
    "name": "Lusaka",
    "countryCode": 245
  },
  {
    "stateCode": 4107,
    "name": "North-Western",
    "countryCode": 245
  },
  {
    "stateCode": 4108,
    "name": "Northern",
    "countryCode": 245
  },
  {
    "stateCode": 4109,
    "name": "Southern",
    "countryCode": 245
  },
  {
    "stateCode": 4110,
    "name": "Western",
    "countryCode": 245
  },
  {
    "stateCode": 4111,
    "name": "Bulawayo",
    "countryCode": 246
  },
  {
    "stateCode": 4112,
    "name": "Harare",
    "countryCode": 246
  },
  {
    "stateCode": 4113,
    "name": "Manicaland",
    "countryCode": 246
  },
  {
    "stateCode": 4114,
    "name": "Mashonaland Central",
    "countryCode": 246
  },
  {
    "stateCode": 4115,
    "name": "Mashonaland East",
    "countryCode": 246
  },
  {
    "stateCode": 4116,
    "name": "Mashonaland West",
    "countryCode": 246
  },
  {
    "stateCode": 4117,
    "name": "Masvingo",
    "countryCode": 246
  },
  {
    "stateCode": 4118,
    "name": "Matabeleland North",
    "countryCode": 246
  },
  {
    "stateCode": 4119,
    "name": "Matabeleland South",
    "countryCode": 246
  },
  {
    "stateCode": 4120,
    "name": "Midlands",
    "countryCode": 246
  },
  {
    "stateCode": 4121,
    "name": "London",
    "countryCode": 247
  }
];

const seedStates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_MAIN);

    console.log("DB Connected");

    await State.deleteMany();

    const result = await State.insertMany(states, {
      ordered: false,
      rawResult: true
    });

    console.log("Inserted:", result.insertedCount);

    process.exit();

  } catch (err) {

    console.log("FULL ERROR:");
    console.log(err);

    if (err.writeErrors) {
      err.writeErrors.forEach((e, index) => {
        console.log(`Error ${index + 1}`);
        console.log(e.errmsg);
      });
    }

    process.exit(1);
  }
};

seedStates();