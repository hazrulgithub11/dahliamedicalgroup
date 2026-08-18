import { PrismaClient } from '../src/generated/prisma/client.js'

import { getDatabaseUrl } from '../src/database-url.js'

import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Dahlia Refill demo data...')

  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.patientRepeat.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.medicine.deleteMany()
  await prisma.clinic.deleteMany()

  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Order_displayId_seq" RESTART WITH 1042`,
  )

  await prisma.clinic.create({
    data: {
      id: 'clinic_selayang',
      name: 'Klinik Dahlia Selayang',
      address: 'No. 12, Jalan Ipoh, Selayang, 68100 Batu Caves, Selangor',
    },
  })

  await prisma.medicine.createMany({
    data: [
      { id: 'med_amlodipine_5', name: 'Amlodipine', strength: '5mg' },
      { id: 'med_losartan_50', name: 'Losartan', strength: '50mg' },
      { id: 'med_metformin_500', name: 'Metformin', strength: '500mg' },
      { id: 'med_gliclazide_80', name: 'Gliclazide', strength: '80mg' },
      { id: 'med_atorvastatin_20', name: 'Atorvastatin', strength: '20mg' },
    ],
  })

  await prisma.patient.createMany({
    data: [
      { id: 'patient_siti', name: 'Siti Aminah', phone: '+60123456789' },
      { id: 'patient_ahmad', name: 'Ahmad Rahman', phone: '+60132223344' },
      { id: 'patient_mei', name: 'Mei Ling', phone: '+60165558899' },
    ],
  })

  await prisma.patientRepeat.createMany({
    data: [
      { patientId: 'patient_siti', medicineId: 'med_amlodipine_5' },
      { patientId: 'patient_siti', medicineId: 'med_losartan_50' },
      { patientId: 'patient_ahmad', medicineId: 'med_metformin_500' },
      { patientId: 'patient_ahmad', medicineId: 'med_gliclazide_80' },
      { patientId: 'patient_ahmad', medicineId: 'med_atorvastatin_20' },
      { patientId: 'patient_mei', medicineId: 'med_amlodipine_5' },
      { patientId: 'patient_mei', medicineId: 'med_atorvastatin_20' },
    ],
  })

  const [clinics, patients, medicines, repeats, orders] = await Promise.all([
    prisma.clinic.count(),
    prisma.patient.count(),
    prisma.medicine.count(),
    prisma.patientRepeat.count(),
    prisma.order.count(),
  ])

  console.log(
    `Seeded ${clinics} clinic, ${patients} patients, ${medicines} medicines, ${repeats} repeats, ${orders} orders`,
  )
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
