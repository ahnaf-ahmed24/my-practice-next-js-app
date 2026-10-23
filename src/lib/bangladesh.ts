// বাংলাদেশের ৮টি বিভাগ ও ৬৪টি জেলা — কুরিয়ার ডেলিভারির জন্য ব্যবহৃত হয়
export type Division = {
    name: string;
    districts: string[];
};

export const divisions: Division[] = [
    {
        name: 'Barishal',
        districts: ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
    },
    {
        name: 'Chattogram',
        districts: [
            'Bandarban',
            'Brahmanbaria',
            'Chandpur',
            'Chattogram',
            "Cox's Bazar",
            'Cumilla',
            'Feni',
            'Khagrachhari',
            'Lakshmipur',
            'Noakhali',
            'Rangamati',
        ],
    },
    {
        name: 'Dhaka',
        districts: [
            'Dhaka',
            'Faridpur',
            'Gazipur',
            'Gopalganj',
            'Kishoreganj',
            'Madaripur',
            'Manikganj',
            'Munshiganj',
            'Narayanganj',
            'Narsingdi',
            'Rajbari',
            'Shariatpur',
            'Tangail',
        ],
    },
    {
        name: 'Khulna',
        districts: [
            'Bagerhat',
            'Chuadanga',
            'Jashore',
            'Jhenaidah',
            'Khulna',
            'Kushtia',
            'Magura',
            'Meherpur',
            'Narail',
            'Satkhira',
        ],
    },
    {
        name: 'Mymensingh',
        districts: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
    },
    {
        name: 'Rajshahi',
        districts: [
            'Bogura',
            'Chapainawabganj',
            'Joypurhat',
            'Naogaon',
            'Natore',
            'Pabna',
            'Rajshahi',
            'Sirajganj',
        ],
    },
    {
        name: 'Rangpur',
        districts: [
            'Dinajpur',
            'Gaibandha',
            'Kurigram',
            'Lalmonirhat',
            'Nilphamari',
            'Panchagarh',
            'Rangpur',
            'Thakurgaon',
        ],
    },
    {
        name: 'Sylhet',
        districts: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
    },
];

// বিভাগ অনুযায়ী জেলার তালিকা
export const getDistricts = (divisionName: string) =>
    divisions.find((division) => division.name === divisionName)?.districts ?? [];

// পুরো দেশের সব জেলা (৬৪টি) — একটি ড্রপডাউনে গ্রুপ করে দেখানো হয়
export const allDistricts = divisions.flatMap((division) => division.districts);

// ঢাকার ভেতরে ডেলিভারি ফ্রি, বাইরে সমতল চার্জ (সাধারণ বাংলাদেশি প্র্যাকটিস)
export const OUTSIDE_DHAKA_DELIVERY_CHARGE = 130;

export type DeliveryZone = 'inside' | 'outside';

export const isInsideDhaka = (district: string) => district === 'Dhaka';

export const getDeliveryZone = (district: string): DeliveryZone =>
    isInsideDhaka(district) ? 'inside' : 'outside';

export const getDeliveryCharge = (district: string) =>
    getDeliveryZone(district) === 'inside' ? 0 : OUTSIDE_DHAKA_DELIVERY_CHARGE;

// বাংলাদেশি মোবাইল নাম্বার — 01XXXXXXXXX (১৭ টি অঙ্ক)
export const isValidBdPhone = (phone: string) => /^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''));
