package com.portal.backend.config;

import java.util.EnumSet;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.portal.backend.entity.ERole;
import com.portal.backend.entity.Roles;
import com.portal.backend.entity.Users;
import com.portal.backend.repository.RoleRepository;
import com.portal.backend.repository.UserRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedRolesAndAdmin(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed all roles if missing
            if (roleRepository.count() == 0) {
                List<Roles> roles = EnumSet.allOf(ERole.class).stream()
                        .map(Roles::new)
                        .toList();
                roleRepository.saveAll(roles);
            }

            // Ensure a known initial admin exists (helps on fresh/dirty DBs)
            if (userRepository.findByEmail("admin@example.com").isEmpty()) {
                Roles adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseGet(() -> roleRepository.save(new Roles(ERole.ROLE_ADMIN)));

                Users admin = new Users("admin", "admin@example.com", passwordEncoder.encode("Admin@123"));
                admin.setRoles(List.of(adminRole));
                userRepository.save(admin);
            }
        };
    }
}

