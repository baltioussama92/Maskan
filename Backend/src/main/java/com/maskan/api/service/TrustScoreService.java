package com.maskan.api.service;

import com.maskan.api.entity.User;
import com.maskan.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TrustScoreService {

    public static final int CHECKIN_BONUS = 10;
    public static final int LATE_CANCEL_PENALTY = 10;
    public static final int MAX_TRUST_SCORE = 100;
    public static final int MIN_TRUST_SCORE = 0;

    private final UserRepository userRepository;

    public int getScore(User user) {
        if (user == null || user.getTrustScore() == null) {
            return 0;
        }
        return user.getTrustScore();
    }

    public int applyDelta(User user, int delta) {
        if (user == null) {
            return 0;
        }

        int current = user.getTrustScore() == null ? 0 : user.getTrustScore();
        int next = Math.max(MIN_TRUST_SCORE, Math.min(MAX_TRUST_SCORE, current + delta));
        user.setTrustScore(next);
        userRepository.save(user);
        return next;
    }

    public int applyDeltaByUserId(String userId, int delta) {
        return userRepository.findById(userId)
                .map(user -> applyDelta(user, delta))
                .orElse(0);
    }
}
