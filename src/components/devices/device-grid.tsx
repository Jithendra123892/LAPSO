import { DeviceCard } from './device-card'
import { BlobDevice } from '@/components/illustrations/blob-device'
import { motion, AnimatePresence } from 'framer-motion'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
}

export function DeviceGrid({ devices, onAddClick }: { devices: any[]; onAddClick: () => void }) {
  if (devices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="neo-empty-state"
      >
        <BlobDevice mood="neutral" size={90} />
        <h3 className="font-heading font-bold text-xl text-dark mb-2 mt-4">No devices yet</h3>
        <p className="font-body text-sm text-dark-light mb-6 max-w-xs mx-auto">
          Add your first device to start tracking. Install the LAPSO agent on your laptop or phone.
        </p>
        <motion.button
          whileHover={{ y: -2, boxShadow: '5px 5px 0 0 #2D3436' }}
          whileTap={{ scale: 0.97 }}
          className="neo-btn-primary font-heading font-bold"
          onClick={onAddClick}
        >
          + Add Device
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {devices.map((device, i) => (
        <motion.div
          key={device.id}
          variants={itemVariants}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25, ease: [0.2, 0, 0, 1] }}
        >
          <DeviceCard device={device} />
        </motion.div>
      ))}
    </motion.div>
  )
}