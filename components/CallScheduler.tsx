import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { format, addDays, setHours, setMinutes, isBefore, addHours } from 'date-fns'
import { Colors } from '../constants/colors'

type Props = {
  onSchedule: (date: Date) => Promise<void>
  onCancel: () => void
}

const TIME_SLOTS = [9, 11, 13, 15, 17, 19, 21]
const DAY_COUNT = 7

function buildDays(): Date[] {
  const days: Date[] = []
  for (let i = 0; i < DAY_COUNT; i++) {
    days.push(addDays(new Date(), i))
  }
  return days
}

function buildSlot(day: Date, hour: number): Date {
  return setMinutes(setHours(new Date(day), hour), 0)
}

function isSlotAvailable(slot: Date): boolean {
  return isBefore(addHours(new Date(), 1), slot)
}

export default function CallScheduler({ onSchedule, onCancel }: Props) {
  const days = buildDays()
  const [selectedDay, setSelectedDay] = useState<Date>(days[0])
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const availableSlots = TIME_SLOTS.filter(h =>
    isSlotAvailable(buildSlot(selectedDay, h))
  )

  async function handleConfirm() {
    if (selectedHour === null) return
    setSaving(true)
    try {
      await onSchedule(buildSlot(selectedDay, selectedHour))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {days.map((day, i) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayPill, isSelected && styles.dayPillActive]}
              onPress={() => { setSelectedDay(day); setSelectedHour(null) }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayPillLabel, isSelected && styles.dayPillLabelActive]}>
                {i === 0 ? 'Today' : format(day, 'EEE d')}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 16 }]}>Select a time</Text>
      <View style={styles.timeGrid}>
        {TIME_SLOTS.map(hour => {
          const available = availableSlots.includes(hour)
          const isSelected = selectedHour === hour
          return (
            <TouchableOpacity
              key={hour}
              style={[
                styles.timePill,
                isSelected && styles.timePillActive,
                !available && styles.timePillDisabled,
              ]}
              onPress={() => available && setSelectedHour(hour)}
              disabled={!available}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timePillText,
                isSelected && styles.timePillTextActive,
                !available && styles.timePillTextDisabled,
              ]}>
                {format(buildSlot(selectedDay, hour), 'h:mm a')}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, (selectedHour === null || saving) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={selectedHour === null || saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.confirmText}>Confirm</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: Colors.haze,
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    marginBottom: 10,
  },
  dayScroll: {
    flexGrow: 0,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.haze,
    marginRight: 8,
    backgroundColor: Colors.white,
  },
  dayPillActive: {
    backgroundColor: Colors.ocean,
    borderColor: Colors.ocean,
  },
  dayPillLabel: {
    fontSize: 14,
    color: Colors.navy,
    fontWeight: '500',
  },
  dayPillLabelActive: {
    color: Colors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.haze,
    backgroundColor: Colors.white,
  },
  timePillActive: {
    backgroundColor: Colors.ocean,
    borderColor: Colors.ocean,
  },
  timePillDisabled: {
    backgroundColor: Colors.frost,
    borderColor: Colors.haze,
  },
  timePillText: {
    fontSize: 14,
    color: Colors.navy,
    fontWeight: '500',
  },
  timePillTextActive: {
    color: Colors.white,
  },
  timePillTextDisabled: {
    color: Colors.mist,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.mist,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.mist,
    fontSize: 15,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.ocean,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
})
